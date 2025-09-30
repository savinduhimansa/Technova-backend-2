import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const buildSchema = new mongoose.Schema({
  buildId: { type: String, unique: true, default: () => uuidv4() }, // auto-generate UUID
  customerEmail: { type: String, required: true },

  cpu: {
    type: String,
    enum: ["","Intel i9", "Intel i7", "Intel i5", "AMD Ryzen 9", "AMD Ryzen 7", "AMD Ryzen 5"],
  },

  motherboard: {
    type: String,
    enum: ["","ASUS ROG Strix Z690", "MSI B550 Tomahawk", "Gigabyte X570 Aorus Elite"],
    
  },

  ram: {
    type: String,
    enum: ["","Corsair Vengeance 16GB", "G.Skill TridentZ 32GB", "Kingston Fury 16GB"],
    //required: true
  },

  gpu: {
    type: String,
    enum: ["","NVIDIA RTX 4090", "NVIDIA RTX 4070", "AMD Radeon RX 7900XT", "AMD Radeon RX 6800"],
    //required: true
  },

  case: {
    type: String,
    enum: ["","NZXT H510", "Corsair iCUE 4000X", "Cooler Master MasterBox TD500"],
    //required: true
  },

  ssd: {
    type: String,
    enum: ["","Samsung 980 Pro 1TB", "WD Black SN850X 1TB", "Crucial P5 Plus 1TB"],
    //required: true
  },

  hdd: {
    type: String,
    enum: ["","Seagate Barracuda 2TB", "WD Blue 2TB", "Toshiba X300 4TB"],
    //required: false
  },

  psu: {
    type: String,
    enum: ["","Corsair RM850x", "EVGA SuperNOVA 750W", "Seasonic Focus GX-650W"],
    //required: true
  },

  fans: {
    type: String,
    enum: ["","Noctua NF-A12", "Corsair LL120", "Cooler Master SickleFlow"],
    //required: false
  },

  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const Build = mongoose.model("Build", buildSchema);
export default Build;
