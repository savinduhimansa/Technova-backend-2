import express from "express";
const router = express.Router();

// Parts must exactly match Build model enums
const parts = {
  cpu: [
    { name: "Intel i9", price: 500 },
    { name: "Intel i7", price: 350 },
    { name: "Intel i5", price: 200 },
    { name: "AMD Ryzen 9", price: 450 },
    { name: "AMD Ryzen 7", price: 300 },
    { name: "AMD Ryzen 5", price: 220 },
  ],
  motherboard: [
    { name: "ASUS ROG Strix Z690", price: 300 },
    { name: "MSI B550 Tomahawk", price: 180 },
    { name: "Gigabyte X570 Aorus Elite", price: 250 },
  ],
  ram: [
    { name: "Corsair Vengeance 16GB", price: 80 },
    { name: "G.Skill TridentZ 32GB", price: 150 },
    { name: "Kingston Fury 16GB", price: 75 },
  ],
  gpu: [
    { name: "NVIDIA RTX 4090", price: 1600 },
    { name: "NVIDIA RTX 4070", price: 600 },
    { name: "AMD Radeon RX 7900XT", price: 900 },
    { name: "AMD Radeon RX 6800", price: 550 },
  ],
  case: [
    { name: "NZXT H510", price: 100 },
    { name: "Corsair iCUE 4000X", price: 120 },
    { name: "Cooler Master MasterBox TD500", price: 90 },
  ],
  ssd: [
    { name: "Samsung 980 Pro 1TB", price: 120 },
    { name: "WD Black SN850X 1TB", price: 130 },
    { name: "Crucial P5 Plus 1TB", price: 100 },
  ],
  hdd: [
    { name: "Seagate Barracuda 2TB", price: 60 },
    { name: "WD Blue 2TB", price: 55 },
    { name: "Toshiba X300 4TB", price: 100 },
  ],
  psu: [
    { name: "Corsair RM850x", price: 140 },
    { name: "EVGA SuperNOVA 750W", price: 130 },
    { name: "Seasonic Focus GX-650W", price: 120 },
  ],
  fans: [
    { name: "Noctua NF-A12", price: 25 },
    { name: "Corsair LL120", price: 30 },
    { name: "Cooler Master SickleFlow", price: 20 },
  ],
};

// GET /api/parts
router.get("/", (req, res) => {
  res.json(parts);
});

export default router;
