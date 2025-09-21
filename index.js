import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import verifyJWT from './middleware/auth.js';
import productRouter from './routes/productRouter.js';
import orderRoutes from "./routes/orders.js";
import deliveryRoutes from "./routes/deliveries.js";
import courierRoutes from "./routes/couriers.js";
import invoiceRoute from "./routes/invoices.js";
import dashboardRoutes from "./routes/salesdashboard.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import dotenv from 'dotenv';
import cors from 'cors';


//mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
dotenv.config();
const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN
}));

/*mongoose.connect("mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(
  () => {
    console.log("Connected to the database");
  }
).catch(
  () => {
    console.log("Connection failed");
  }
)*/

mongoose.connect(process.env.MONGO_URL).then(
  () => {
    console.log("Connected to the database");
  }
).catch(
  () => {
    console.log("Connection failed");
  }
)

app.use(bodyParser.json());

app.use("/api/chatbot", chatbotRoutes);

app.use(verifyJWT);



app.use("/api/product", productRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/couriers", courierRoutes);
app.use("/api/invoices",invoiceRoute);
app.use("/api/dashboard", dashboardRoutes);


app.listen(5001, 
  () => {
    console.log("Server is running on port 5001");
  }
);