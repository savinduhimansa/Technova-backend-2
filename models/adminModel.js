// import mongoose from "mongoose";


// const adminSchema = new mongoose.Schema({
//     email: {
//         type: String,
//         required: true,
//         unique: true, 
//     },
//     firstName: {
//         type: String,
//         required: true,
//     },
//     lastName: {
//         type: String,
//         required: true,
//     },
//     role: {
//         type: String,
//         required: true,
//         enum: ["user", "admin"], // Only allow "user" or "admin"
//         default: "user" 
//     },
//     password: {
//         type: String,
//         required: true,
//     },
//     phone: {
//         type: String,
//         required: true,
//         default: "Not given"
//     },
//     isDisable: {
//         type: Boolean,
//         required: true,
//         default: false
//     },
//     isEmailVerified: {
//         type: Boolean,
//         required: true,
//         default: false
//     }
// });

// const Admin = mongoose.model("Admin", adminSchema);
// export default Admin;