// controllers/chatbotController.js
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import Product from "../models/product.js";
import jwt from "jsonwebtoken";
// --- GEMINI SDK ---
import { GoogleGenerativeAI } from "@google/generative-ai";

const tidy = (s) => String(s || "").trim();

// OPTIONAL toggle via env: set USE_CHATBOT_AI=false to disable AI branch entirely
const USE_CHATBOT_AI = String(process.env.USE_CHATBOT_AI || "true").toLowerCase() !== "false";

function getUserFromAuth(req) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice("Bearer ".length);
    // Use the same secret as your login
    const secret = process.env.JWT_SECRET || "random456";
    const payload = jwt.verify(token, secret);
    return payload; // e.g. { id, role, email }
  } catch {
    return null;
  }
}

function extractOrderId(text) {
  const m = tidy(text).match(/\b(OD-\d{3,})\b/i);
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

// --- GEMINI init + “circuit breaker” for quota errors ---
let aiTemporarilyDisabled = false;
let aiDisabledUntil = 0;

const hasKey = USE_CHATBOT_AI && !!process.env.GOOGLE_API_KEY;
const genAI = hasKey ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;
// keep your env value but we’ll try a fallback list below
const modelName = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";

// Small helper: fallback text when AI is off/unavailable
function fallbackAnswer() {
  return {
    answer:
      'I can help with:\n' +
      '• Product search: try “search laptop”\n' +
      '• Order status: “order OD-001” (login required)\n' +
      '• Delivery tracking: “delivery OD-001” (login required)',
  };
}

export const chatbotQuery = async (req, res) => {
  try {
    const query = tidy(req.body?.query);
    if (!query) {
      return res.json({ answer: "Hi! Ask me about products, orders, or deliveries." });
    }

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

      let orderQuery = { orderID: id };
      if (role === "user") {
        // Optional soft binding by phone if the client provides it
        const clientPhone = req.headers["x-user-phone"];
        if (clientPhone) orderQuery.phoneNumber = clientPhone;
      }

      const order = await Order.findOne(orderQuery).populate("products.product");
      if (!order) return res.json({ answer: "I couldn't find an order with that reference (or it isn’t yours)." });

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

      const delivery = await Delivery.findOne({ orderId: id });
      if (!delivery) return res.json({ answer: `No delivery found for order ${id}.` });

      if (role === "user") {
        const clientPhone = req.headers["x-user-phone"]; // optional
        if (clientPhone) {
          const order = await Order.findOne({ orderID: id, phoneNumber: clientPhone });
          if (!order) {
            return res.json({ answer: "This delivery doesn’t appear to belong to your account." });
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

    // ========= GENERAL AI (Gemini) with fallback & robust retries =========
    const now = Date.now();
    const aiUnavailable = !hasKey || aiTemporarilyDisabled || now < aiDisabledUntil;
    if (aiUnavailable) return res.json(fallbackAnswer());

    try {
      // Prefer a more stable model first; fall back if the API throws 500s
      const MODEL_CANDIDATES = [
        "models/gemini-2.5-pro",          // try Pro first
        modelName,                        // your configured default (e.g. gemini-2.5-flash)
        "models/gemini-2.5-flash-lite",
        "models/gemini-2.0-flash",
        "models/gemini-2.0-flash-001",
      ];

      const prompt =
        "You are TechNova’s Computer Retail & IT Services assistant. " +
        "You must ONLY answer questions about: computers and components (laptops, desktops, GPUs, CPUs, RAM, SSDs, monitors, peripherals), " +
        "pricing and availability, PC building and compatibility, warranties/returns, and TechNova’s CRM workflows (products, orders, invoices, deliveries, dashboards, support tickets, repairs, IT services).\n" +
        "If the user asks anything outside of these topics, respond exactly: 'I only help with computer retail and IT services.'\n" +
        "Prefer short, clear answers. If the user asks about order/delivery, ask for an Order ID like OD-001 and remind that login is required.\n\n" +
        `User: ${query}`;

      let lastErr;
      for (const m of MODEL_CANDIDATES) {
        try {
          const model = genAI.getGenerativeModel({ model: m });

          // Retry up to 3 times on 500s with small backoff
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const result = await model.generateContent(prompt);
              const answer = result?.response?.text?.() || "Sorry, I couldn't think of a response.";
              return res.json({ answer: answer.trim() });
            } catch (e) {
              const s = e?.status || e?.response?.status;
              const is500 = s === 500 || String(e?.message || "").includes("Internal");
              if (is500 && attempt < maxAttempts) {
                // simple backoff: 250ms, 600ms
                const wait = attempt === 1 ? 250 : 600;
                await new Promise((r) => setTimeout(r, wait));
                continue;
              }
              throw e;
            }
          }
        } catch (e) {
          lastErr = e;
          // try next model
        }
      }

      // If all models failed:
      throw lastErr || new Error("All Gemini models failed");
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const message = String(err?.message || "").toLowerCase();
      const isQuotaOrRate =
        status === 429 ||
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("resource_exhausted");

      if (isQuotaOrRate) {
        aiTemporarilyDisabled = true;
        aiDisabledUntil = Date.now() + 10 * 60 * 1000; // 10 min cool-off
        console.warn("Gemini quota/rate limited. Falling back for 10 minutes.");
        return res.json({
          answer:
            "AI answers are temporarily unavailable due to usage limits. " +
            "You can still:\n• Search products: “search laptop”\n• Check orders: “order OD-001” (login)\n• Track deliveries: “delivery OD-001” (login)",
        });
      }

      console.error("chatbot AI error (Gemini):", err);
      return res.json(fallbackAnswer());
    }
  } catch (err) {
    console.error("chatbot error:", err);
    return res.status(500).json({ answer: "Error processing your request." });
  }
};
