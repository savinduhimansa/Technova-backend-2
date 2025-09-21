import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import verifyJWT from './middleware/auth.js';
import productRouter from './routes/productRouter.js';
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import partsRouter from './routes/partsRouter.js';

const app = express();

app.use(cors());

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

app.use(verifyJWT);

app.use("/api/product", productRouter);
app.use("/api/parts", partsRouter);

app.listen(5001, 
  () => {
    console.log("Server is running on port 5001");
  }
);