const mongoose = require('../seller_routes/db');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
     address: {
        type: Object,
        default: {}, 
    },
});

module.exports = mongoose.model("User", userSchema);
