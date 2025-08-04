const mongoose = require('./db');

const sellerSchema = new mongoose.Schema({
  username: String,
  password: String
});

module.exports = mongoose.model("Seller", sellerSchema); 
