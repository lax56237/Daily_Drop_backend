const mongoose = require('./db');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    sellerId: { type: Schema.Types.ObjectId, required: true },
    name: String,
    category: String,
    weight: String,
    price: Number,
    quantity: Number,
    description: String,
    sellCount: {
        type: Number,
        default: 0,
    },
    imageUrl : String,
});

module.exports = mongoose.model("Product", productSchema);