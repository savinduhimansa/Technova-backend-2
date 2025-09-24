import mongoose from 'mongoose';
const { Schema } = mongoose; 

const staffSchema = new Schema({
    staffId: {
        type: Number,
        unique: true,  
    },
    name: {
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["productManager", "inventoryManager", "technician", "salesManager"]
    },
    email: {
        type: String,
        required: true,
        unique: true, 
    },
    age: {
        type: Number,
        required: true,
    },
    password: {
        type: String,
        required: true,
        
    },
    address: {
        type: String,
        required: true,
    },
isDisable: {
        type: Boolean,
        required: true,
        default: false
    }
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;