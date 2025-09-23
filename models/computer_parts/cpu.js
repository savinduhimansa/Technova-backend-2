import mongoose from "mongoose";

const cpuSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true
  },
  brand: {
    type: String,
    enum: ["AMD", "Intel"],  // Ryzen => AMD
    required: true
  },
  model: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  socket: {
    type: String,
    required: true   // AM4, AM5, LGA1700
  },  
   brand:{
        type: String,
        required: true,
        trim: true,
    },
  altNames: {
    type: [String],
    default: []
  },
  category: {
      type: String,
      required: true,
      enum: {
        values: [
          'Laptops',
          'Desktops',
          'Monitors',
          'Keyboards',
          'Mice',
          'Headsets',
          'Graphics Cards',
          'CPUs',
          'Storage',
        ]
      }
    },
  price: {
    type: Number,
    required: true
  },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: {
    type: Number,
    required: true
  },
  tdpWatts: { 
    type: Number, 
    default: 65 
  },      // optional, used for PSU sizing
  ratingsQuantity: {
      type: Number,
      default: 0,
    } 
})

const Cpu = mongoose.model("cpus",cpuSchema);

export default Cpu;