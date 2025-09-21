import express from 'express';
import cors from "cors";
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import verifyJWT from './middleware/auth.js';
import productRouter from './routes/productRouter.js';

//import Servicemiddle from './middleware/Servicemiddle.js';
import ServiceRoute from './routes/ServiceRoutes.js';
import TicketRoutes from './routes/TicketRoutes.js';
import RepairRoutes from './routes/RepairRoutes.js';

import Service from './models/ServiceModel.js'; 
import Repair from './models/RepairModel.js';


//mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

const app = express();
 app.use(cors());              
 app.use(express.json()); 
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://admin:123@cluster0.wgv5e81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(
  () => {
    console.log("Connected to the database");
  }
).catch(
  () => {
    console.log("Connection failed");
  }
)



app.use(verifyJWT);

app.use("/api/product", productRouter)
app.use('/api/services', ServiceRoute)
app.use('/api/ticket', TicketRoutes)
app.use(verifyJWT); 
app.use('/app/repair',RepairRoutes )


app.get('/api/dashboard/counts', async (req, res) => {
  try {
    const services = await Service.countDocuments();
    const totalTickets = await Repair.countDocuments();

    // Count by status
    const pendingRequests = await Repair.countDocuments({ status: 'Pending' });
    const approvedRequests = await Repair.countDocuments({ status: 'Approved' });
    const inProgress = await Repair.countDocuments({ status: 'In Progress' });
    const checking = await Repair.countDocuments({ status: 'Checking' });
    const done = await Repair.countDocuments({ status: 'Done' });
    const cancelled = await Repair.countDocuments({ status: 'Cancelled' });

    res.status(200).json({
      services,
      totalTickets,
      pendingRequests,
      approvedRequests,
      inProgress,
      checking,
      done,
      cancelled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




app.listen(5001, 
  () => {
    console.log("Server is running on port 5001");
  }
);


