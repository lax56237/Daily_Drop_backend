const mongoose = require('./db');

const sellerDetailSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }, 
  shopName: String,
  phone: String,
  pincode: String,
  address: String,
  city: String,
  state: String,
  landmark: String
});

module.exports = mongoose.model("SellerDetail", sellerDetailSchema); 