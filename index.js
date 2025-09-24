import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import verifyJWT from './middleware/auth.js';
import productRouter from './routes/productRouter.js';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import userRouters from './routes/userRouters.js';
import feedbackRouters from './routes/feedbackRouters.js';
import authRoutes from './routes/authRouters.js';
import orderRoutes from "./routes/orders.js";
import deliveryRoutes from "./routes/deliveries.js";
import courierRoutes from "./routes/couriers.js";
import invoiceRoute from "./routes/invoices.js";
import dashboardRoutes from "./routes/salesdashboard.js";
import publicOrderRoutes from "./routes/orders.public.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js"; 
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();


//mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN
}));

mongoose.connect(process.env.MONGO_URL).then(
  () => {
    console.log("Connected to the database");
  }
).catch(
  () => {
    console.log("Connection failed");
  }
)


//Gayani

dotenv.config()


app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());
app.use("/api/public/orders", publicOrderRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use("/api", userRouters);
// app.use("/api/user", userRouters);
// app.use("/api/staff", userRouters);
// app.use("/api/admin", userRouters);

app.use('/api/feedback', feedbackRouters); 

app.use('/api/auth', authRoutes);

app.use(verifyJWT);



app.use("/api/products", productRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/couriers", courierRoutes);
app.use("/api/invoices",invoiceRoute);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoutes); // 




/*app.use((req, res, next) => {
    const header = req.header("Authorization");
    if (header) {
        const token = header.replace("Bearer ", "");
        try {
            const decoded = jwt.verify(token, "random456");
            req.user = decoded;
        } catch (err) {
            console.log("Token verification failed:", err);
        }
    }
    next();
});*/





app.listen(5001, 
  () => {
    console.log("Server is running on port 5001");
  }
);


