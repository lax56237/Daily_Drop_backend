const express = require("express");
const router = express.Router();
const Seller = require("./seller");
const SellerDetail = require("./sellerDetail");
const Product = require('./Product');
const Cart = require('../user_routes/Cart');
const User = require('../user_routes/User');
const SellerOrder = require('./sellerOrder');
const DeliveryBoy = require('../dilivery_routes/DeliveryBoy');

router.put("/update-detail", async (req, res) => {
  if (!req.session.user?.sellerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const updated = await SellerDetail.findOneAndUpdate(
      { sellerId: req.session.user.sellerId },
      { ...req.body },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mine', async (req, res) => {
  if (!req.session.user || !req.session.user.sellerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const products = await Product.find({ sellerId: req.session.user.sellerId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/add', async (req, res) => {
  if (!req.session.user || !req.session.user.sellerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const product = await Product.create({
      sellerId: req.session.user.sellerId,
      ...req.body
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const seller = await Seller.create({ username, password });

    req.session.user = { email: username, sellerId: seller._id };
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24;

    res.status(201).json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/details', async (req, res) => {
  if (!req.session.user || !req.session.user.sellerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const seller = await Seller.findById(req.session.user.sellerId).lean();
    const details = await SellerDetail.findOne({ sellerId: req.session.user.sellerId }).lean();

    res.json({ seller, details });
  } catch (err) {
    console.error("Error fetching seller info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register-detail", async (req, res) => {
  const { sellerId, shopName, phone, pincode, address, city, state, landmark } = req.body;
  try {
    const detail = await SellerDetail.create({
      sellerId,
      shopName,
      phone,
      pincode,
      address,
      city,
      state,
      landmark
    });
    res.status(201).json(detail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/order', async (req, res) => {
  try {
    const { address, items } = req.body;
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail });

    user.address = address;
    await user.save();

    const cart = new Cart({
      email: userEmail,
      items: items.map(item => ({
        name: '',
        quantity: item.quantity
      })),
      totalPrice: 0,
      delivery_status: 'ready'
    });
    await cart.save();

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const sellerId = product.sellerId;

      // Find or create seller order record
      let sellerOrder = await SellerOrder.findOne({ sellerId });
      if (!sellerOrder) {
        sellerOrder = new SellerOrder({ sellerId, orders: [] });
      }

      sellerOrder.orders.push({
        cartId: cart._id,
        customerName: address.name,
        items: [{ productId: item.productId, quantity: item.quantity }]
      });

      await sellerOrder.save();
    }

    res.status(200).json({ msg: 'Order placed successfully', cartId: cart._id });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/me", async (req, res) => {
  const seller = await Seller.findById(req.session.sellerId);
  res.json(seller);
});

router.post('/orderDispatch', async (req, res) => {
    try {
        const cart = req.body;

        if (!cart || !cart._id || !Array.isArray(cart.items)) {
            return res.status(400).json({ error: 'Cart is invalid or missing items' });
        }

        const fullCart = await Cart.findById(cart._id);
        if (!fullCart) return res.status(404).json({ error: 'Cart not found' });

        const user = await User.findOne({ email: fullCart.email });
        if (!user || !user.address) return res.status(404).json({ error: 'User or address not found' });

        const customerInfo = {
            name: user.address.name || 'Unknown',
            address: {
                street: user.address.street || '',
                city: user.address.city || '',
                state: user.address.state || '',
                pincode: user.address.pincode || '',
                landmark: user.address.landmark || ''
            }
        };

        await Promise.all(fullCart.items.map(async item => {
            const product = await Product.findOne({ name: item.name });
            if (!product || !product.sellerId) return;

            const sellerOrder = new SellerOrder({
                sellerId: product.sellerId,
                customer: customerInfo,
                itemName: product.name,
                quantity: item.quantity,
                cart_id: cart._id
            });

            await sellerOrder.save();
        }));

        res.status(200).json({ msg: 'Seller orders created successfully' });

    } catch (error) {
        console.error('Error in /seller/orderDispatch:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/get-orders', async (req, res) => {
    try {
        const sellerId = req.session.user?.sellerId;
        if (!sellerId) return res.status(401).json({ error: 'Seller not logged in' });

        const orders = await SellerOrder.find({ sellerId });
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/verify-delivery', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

        const deliveryBoy = await DeliveryBoy.findOne({ phone });
        if (!deliveryBoy) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if(deliveryBoy.delivery_status == "ondelivery"){
          return res.status(200).json({ success: true, message: 'Delivery verified' });
        }
        else{
          return res.json({success : false, message:"this delivery has not any order"});
        }
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ success: false, message: 'Internal error' });
    }
});

module.exports = router;