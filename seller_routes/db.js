const mongoose = require("mongoose");

// mongoose.connect("mongodb://localhost:27017/mydb")
mongoose.connect("mongodb+srv://lax56237:2005Laxmongo@lax.c4it2gr.mongodb.net/lax")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

module.exports = mongoose;