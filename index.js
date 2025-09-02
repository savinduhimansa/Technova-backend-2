import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import verifyJWT from './middleware/auth.js';
import productRouter from './routes/productRouter.js';


//mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

const app = express();

mongoose.connect("mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(
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

app.use("/api/product", productRouter)

app.listen(5000, 
  () => {
    console.log("Server is running on port 5000");
  }
);