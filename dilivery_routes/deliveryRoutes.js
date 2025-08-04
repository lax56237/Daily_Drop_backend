const express = require('express');
const router = express.Router();
const DeliveryBoy = require('./DeliveryBoy');
const Cart = require('../user_routes/Cart');
const User = require('../user_routes/User');
const Product = require('../seller_routes/Product');
const SellerDetail = require('../seller_routes/sellerDetail');
const nodemailer = require('nodemailer');
const SellerOrder = require('../seller_routes/sellerOrder');

const otpMap = new Map();

router.post('/register', async (req, res) => {
    const { name, password, phone } = req.body;
    try {
        const exists = await DeliveryBoy.findOne({ name });
        if (exists) return res.status(400).json({ msg: 'Name already exists' });

        const newBoy = await DeliveryBoy.create({ name, password, phone });
        req.session.deliveryName = newBoy.name;
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
        res.status(201).json({ msg: 'Account created', name: newBoy.name });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { name, password } = req.body;
    const boy = await DeliveryBoy.findOne({ name, password });
    if (!boy) return res.status(401).json({ msg: 'Invalid credentials' });

    req.session.deliveryName = boy.name;
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
    res.json({ msg: 'Login successful', name: boy.name });
});

router.get('/check', (req, res) => {
    if (!req.session.deliveryName) return res.status(401).json({ msg: 'Not logged in' });
    res.json({ name: req.session.deliveryName });
});

router.get('/orders', async (req, res) => {
    try {
        if (!req.session.deliveryName) return res.status(401).json({ msg: 'Not logged in' });

        const deliveryBoy = await DeliveryBoy.findOne({ name: req.session.deliveryName });
        if (!deliveryBoy || deliveryBoy.delivery_status !== 'ready') {
            return res.status(403).json([]); // Don't show any orders
        }

        const readyCarts = await Cart.find({ delivery_status: 'ready' });

        const fullOrders = await Promise.all(
            readyCarts.map(async (cart) => {
                const user = await User.findOne({ email: cart.email });

                const items = await Promise.all(
                    cart.items.map(async (item) => {
                        const product = await Product.findOne({ name: item.name });
                        const seller = product
                            ? await SellerDetail.findOne({ sellerId: product.sellerId })
                            : null;

                        return {
                            name: item.name,
                            quantity: item.quantity,
                            product,
                            seller,
                        };
                    })
                );

                return {
                    cartId: cart._id,
                    user: {
                        name: user?.address?.name || '',
                        phone: user?.address?.phone || '',
                        address: user?.address || {}
                    },
                    items
                };
            })
        );

        res.json(fullOrders);
    } catch (err) {
        console.error('Error fetching delivery orders:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/take-order', async (req, res) => {
    const { cartId } = req.body;
    const deliveryName = req.session.deliveryName;
    try {
        await Cart.findByIdAndUpdate(cartId, { delivery_status: 'ondelivery' });
        await DeliveryBoy.findOneAndUpdate(
            { name: deliveryName },
            { delivery_status: 'ondelivery', cart_id: cartId },
        );
        res.json({ msg: 'Order taken' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Failed to take order' });
    }
});

router.post('/order-sheet', async (req, res) => {
    try {
        const { cartId } = req.body;

        if (!cartId) return res.status(400).json({ error: 'Cart ID is required' });

        const cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const user = await User.findOne({ email: cart.email });

        const itemsWithDetails = await Promise.all(cart.items.map(async item => {
            const product = await Product.findOne({ name: item.name });
            if (!product) return null;

            const seller = await SellerDetail.findOne({ sellerId: product.sellerId });

            return {
                quantity: item.quantity,
                product: {
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    category: product.category,
                    weight: product.weight,
                    description: product.description,
                },
                seller: seller ? {
                    shopName: seller.shopName,
                    phone: seller.phone,
                    address: seller.address,
                    city: seller.city,
                    state: seller.state,
                    pincode: seller.pincode,
                    landmark: seller.landmark
                } : null
            };
        }));

        const orderSheet = {
            cartId: cart._id,
            user: {
                email: user?.email,
                address: user?.address || {}
            },
            items: itemsWithDetails.filter(Boolean)
        };

        res.status(200).json(orderSheet);
    } catch (error) {
        console.error('Error generating order sheet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Email not found' });

    const otp = Math.floor(1000 + Math.random() * 9000);
    const expireAt = Date.now() + 2 * 60 * 1000;
    otpMap.set(email, { code: otp.toString(), expireAt });

    const deliveryName = req.session.deliveryName;
    await DeliveryBoy.findOneAndUpdate(
        { name: deliveryName },
        { otp_message: otp.toString() }
    );

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lax56237@gmail.com',
            pass: 'kafd ovwn cnho rbkp',
        },
    });

    await transporter.sendMail({
        from: 'Daily Drop',
        to: email,
        subject: 'verify otp',
        text: `Your OTP is ${otp}`,
    });

    res.json({ otp });
});

router.post('/verify-otp', async (req, res) => {
    const { enteredOtp } = req.body;
    const deliveryName = req.session.deliveryName;

    const deliveryBoy = await DeliveryBoy.findOne({ name: deliveryName });
    if (!deliveryBoy) return res.status(404).json({ msg: 'Delivery boy not found' });

    if (deliveryBoy.otp_message !== enteredOtp) {
        return res.status(401).json({ success: false, msg: 'Wrong OTP' });
    }

    res.json({ success: true });
});

router.post('/success_delivery', async (req, res) => {
    try {
        const deliveryName = req.session.deliveryName;
        const deliveryBoy = await DeliveryBoy.findOne({ name: deliveryName });

        if (!deliveryBoy || !deliveryBoy.cart_id) {
            return res.status(400).json({ msg: 'Cart not assigned' });
        }

        const cartId = deliveryBoy.cart_id;

        await DeliveryBoy.findOneAndUpdate(
            { name: deliveryName },
            { delivery_status: 'ready', otp_message: null, cart_id: null }
        );

        await Cart.findByIdAndDelete(cartId);

        await SellerOrder.deleteMany({ cart_id: cartId });

        res.json({ msg: 'Delivery success and cleaned up' });
    } catch (error) {
        console.error('Success delivery error:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

module.exports = router;