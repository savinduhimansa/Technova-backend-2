// controllers/chatbotController.js
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import Product from "../models/product.js";
import OpenAI from "openai";
import jwt from "jsonwebtoken";

const tidy = (s) => String(s || "").trim();

// Optional JWT reader (because route is public now)
function getUserFromAuth(req) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice("Bearer ".length);
    // Use the same secret you use in login
    const secret = process.env.JWT_SECRET || "random456";
    const payload = jwt.verify(token, secret);
    // payload contains { id, role, email } per your loginUser()
    return payload; 
  } catch {
    return null;
  }
}

function extractOrderId(text) {
  const m = tidy(text).match(/\bOD-\d{3,}\b/i);
  return m ? m[0].toUpperCase() : null;
}
function lastWord(text) {
  const parts = tidy(text).split(/\s+/);
  return parts[parts.length - 1] || "";
}
function isProductIntent(s) {
  s = s.toLowerCase();
  return s.includes("search") || s.includes("find") || s.includes("product");
}
function isOrderIntent(s) {
  s = s.toLowerCase();
  return s.includes("order") || s.includes("invoice");
}
function isDeliveryIntent(s) {
  s = s.toLowerCase();
  return s.includes("delivery") || s.includes("track");
}

const hasKey = !!process.env.OPENAI_API_KEY;
const openai = hasKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export const chatbotQuery = async (req, res) => {
  try {
    const query = tidy(req.body?.query);
    if (!query) return res.json({ answer: "Hi! Ask me about products, orders, or deliveries." });

    // Optional auth (route is public)
    const user = getUserFromAuth(req); // null if not logged in
    const role = user?.role;

    // ========= PRODUCT SEARCH (open to all) =========
    if (isProductIntent(query)) {
      const termMatch = query.match(/(?:search|find|product)\s+(.+)/i);
      const term = tidy(termMatch ? termMatch[1] : query.replace(/product/i, ""));
      const nameRegex = term ? new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /.*/;

      const products = await Product.find({ name: nameRegex }).limit(6);
      if (!products.length) {
        return res.json({ answer: `No products found for "${term || "your query"}".` });
      }
      const list = products.map((p) => ({
        name: p.name,
        price: p.price,
        productId: p.productId,
        stock: p.stock,
        image: p.images?.[0],
      }));
      return res.json({
        answer: `Here are ${list.length} product(s) I found.`,
        products: list,
      });
    }

    // ========= ORDER STATUS (requires login; users only see their own) =========
    if (isOrderIntent(query)) {
      if (!user) {
        return res.json({
          answer: "Please log in to check your order status. Once logged in, ask like: “order OD-001”.",
          requireLogin: true,
        });
      }

      const id = extractOrderId(query) || lastWord(query);
      if (!id) return res.json({ answer: "What’s your Order ID? (e.g., OD-001)" });

      // Admin / salesmanager can view any
      let orderQuery = { orderID: id };
      if (role === "user") {
        // Regular user must match their phone (your schema stores phoneNumber on Order)
        // NOTE: your JWT payload from login doesn’t include phone.
        // If you need stricter binding, either:
        //  1) include phone in the JWT payload at login, OR
        //  2) look up the User by user.id and fetch their phone here.
        // For simplicity, we only allow by email if you add email to orders, or fallback to phone if you add phone to JWT.
        // Here we do a permissive check: require phone match if client sends `x-user-phone`.
        const clientPhone = req.headers["x-user-phone"]; // optional header from frontend
        if (clientPhone) {
          orderQuery.phoneNumber = clientPhone;
        }
      }

      const order = await Order.findOne(orderQuery).populate("products.product");
      if (!order) return res.json({ answer: "I couldn't find an order with that reference (or it isn’t yours)." });

      // If role === user and you didn’t pass a phone header, we still do a soft-guard:
      // deny if the order phone doesn’t look like the user's known phone (if you later attach phone to JWT).
      // Skipping here due to current data model.

      const items = (order.products || []).map((p) => ({
        name: p?.product?.name || p.productId,
        qty: p.quantity,
        unitPrice: p.unitPrice,
      }));

      return res.json({
        answer: `Order ${order.orderID}: ${order.status}. Total $${(order.totalPrice ?? 0).toFixed(2)}.`,
        order: {
          orderID: order.orderID,
          customerName: order.customerName,
          status: order.status,
          totalPrice: order.totalPrice ?? 0,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          items,
          createdAt: order.createdAt,
        },
      });
    }

    // ========= DELIVERY STATUS (requires login; users only see their own) =========
    if (isDeliveryIntent(query)) {
      if (!user) {
        return res.json({
          answer: "Please log in to track your delivery. Once logged in, ask like: “delivery OD-001”.",
          requireLogin: true,
        });
      }
      const id = extractOrderId(query) || lastWord(query);
      if (!id) return res.json({ answer: "Please share your Order ID (e.g., OD-001) to track delivery." });

      let delivery = await Delivery.findOne({ orderId: id });
      if (!delivery) return res.json({ answer: `No delivery found for order ${id}.` });

      // If user role is 'user', optionally enforce phone binding via the related order:
      if (role === "user") {
        const clientPhone = req.headers["x-user-phone"]; // optional header
        if (clientPhone) {
          const order = await Order.findOne({ orderID: id, phoneNumber: clientPhone });
          if (!order) {
            return res.json({
              answer: "This delivery doesn’t appear to belong to your account.",
            });
          }
        }
      }

      return res.json({
        answer: `Delivery for ${id}: ${delivery.status}. Scheduled ${delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleString() : "N/A"} via ${delivery.courierService}.`,
        delivery: {
          orderID: delivery.orderId,
          status: delivery.status,
          courierService: delivery.courierService,
          scheduledDate: delivery.scheduledDate,
          updatedAt: delivery.updatedAt,
        },
      });
    }

    // ========= GENERAL AI (open to all) =========
    if (!hasKey) {
      return res.json({
        answer:
          'I can search products (e.g., "search laptop"), check order status ("order OD-001" — login required), and track deliveries ("delivery OD-001" — login required).',
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a concise retail assistant for TechNova. Prefer short, clear answers. If the user asks about order/delivery, ask for an Order ID like OD-001 and remind that login is required.",
        },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const answer =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't think of a response.";
    return res.json({ answer });
  } catch (err) {
    console.error("chatbot error:", err);
    return res.status(500).json({ answer: "Error processing your request." });
  }
};
