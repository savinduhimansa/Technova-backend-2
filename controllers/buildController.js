import Build from "../models/build.js";

// Price mapping for enums
const prices = {
  cpu: {
    "Intel i9": 600, "Intel i7": 450, "Intel i5": 300,
    "AMD Ryzen 9": 550, "AMD Ryzen 7": 400, "AMD Ryzen 5": 280
  },
  motherboard: {
    "ASUS ROG Strix Z690": 350, "MSI B550 Tomahawk": 200, "Gigabyte X570 Aorus Elite": 220
  },
  ram: {
    "Corsair Vengeance 16GB": 80, "G.Skill TridentZ 32GB": 150, "Kingston Fury 16GB": 75
  },
  gpu: {
    "NVIDIA RTX 4090": 1600, "NVIDIA RTX 4070": 700,
    "AMD Radeon RX 7900XT": 900, "AMD Radeon RX 6800": 600
  },
  case: {
    "NZXT H510": 80, "Corsair iCUE 4000X": 120, "Cooler Master MasterBox TD500": 110
  },
  ssd: {
    "Samsung 980 Pro 1TB": 130, "WD Black SN850X 1TB": 140, "Crucial P5 Plus 1TB": 110
  },
  hdd: {
    "Seagate Barracuda 2TB": 50, "WD Blue 2TB": 55, "Toshiba X300 4TB": 100
  },
  psu: {
    "Corsair RM850x": 130, "EVGA SuperNOVA 750W": 120, "Seasonic Focus GX-650W": 100
  },
  fans: {
    "Noctua NF-A12": 30, "Corsair LL120": 35, "Cooler Master SickleFlow": 25
  }
};

// Helper: calculate total price
const calculateTotal = (data) => {
  let total = 0;
  for (let key of Object.keys(prices)) {
    if (data[key]) {
      total += prices[key][data[key]] || 0;
    }
  }
  return total;
};

// Create new build
export const createBuild = async (req, res) => {
  try {
    const data = req.body;
    const totalPrice = calculateTotal(data);

    const build = new Build({ ...data, totalPrice });
    await build.save();
    res.status(201).json(build);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all builds
export const getBuilds = async (req, res) => {
  try {
    const builds = await Build.find();
    res.json(builds);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update build (only pending)
export const updateBuild = async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    if (build.status !== "pending") {
      return res.status(400).json({ message: "Only pending builds can be updated" });
    }

    const data = req.body;
    build.cpu = data.cpu || build.cpu;
    build.motherboard = data.motherboard || build.motherboard;
    build.ram = data.ram || build.ram;
    build.gpu = data.gpu || build.gpu;
    build.case = data.case || build.case;
    build.ssd = data.ssd || build.ssd;
    build.hdd = data.hdd || build.hdd;
    build.psu = data.psu || build.psu;
    build.fans = data.fans || build.fans;

    build.totalPrice = calculateTotal(build.toObject());

    await build.save();
    res.json(build);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete build (only pending)
export const deleteBuild = async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    if (build.status !== "pending") {
      return res.status(400).json({ message: "Only pending builds can be deleted" });
    }

    await build.deleteOne();
    res.json({ message: "Build deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin approve/reject build
export const updateBuildStatus = async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    build.status = status;
    await build.save();
    res.json(build);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
