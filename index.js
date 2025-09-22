import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import verifyJWT from './middleware/auth.js';
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import partsRouter from './routes/partsRouter.js';
import buildRequestRouter from "./routes/buildRequestRouter.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URL).then(
  () => console.log("Connected to the database"),
).catch(
  () => console.log("Connection failed")
);

// If you want public GETs to work without a token, you can move this
// below and let the router protect only the routes that need it.
// You currently set req.user when Authorization exists (non-blocking).
app.use(verifyJWT);

app.use("/api/parts", partsRouter);
app.use("/api/build-requests", buildRequestRouter); 

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
