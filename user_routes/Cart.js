const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
});

const cartSchema = new mongoose.Schema({
  email: String,
  items: [itemSchema],
  totalPrice: Number,
  
   delivery_status: {
        type: String,
        enum: ['ready', 'ondelivery', 'delivered'],
        default: 'ready'
    }
});

module.exports = mongoose.model('Cart', cartSchema);
