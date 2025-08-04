const mongoose = require('../seller_routes/db');
const Schema = mongoose.Schema;

const deliveryBoySchema = new Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    delivery_status: {
        type: String,
        enum: ['ready', 'ondelivery'],
        default: 'ready'
    },
    otp_message: {
        type: String,
        default: null
    },
    cart_id: {
        type: Schema.Types.ObjectId,
        ref: 'Cart',
        default: null
    }
});



module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);