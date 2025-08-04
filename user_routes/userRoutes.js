const express = require('express');
const router = express.Router();
const User = require('./User');
const session = require('express-session');
const nodemailer = require('nodemailer');
const Cart = require('./Cart');

const otpMap = new Map();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: 'Email already exists' });

        const newUser = await User.create({ email, password });
        req.session.userId = newUser._id;
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;

        res.status(201).json({ msg: 'Account created', email });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

    req.session.userId = user._id;
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000;

    res.json({ msg: 'Login successful', email });
});

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Email not found' });

    const otp = Math.floor(1000 + Math.random() * 9000);
    const expireAt = Date.now() + 2 * 60 * 1000;

    otpMap.set(email, { code: otp.toString(), expireAt });

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
        subject: 'Your OTP',
        text: `Your OTP is ${otp}`,
    });

    res.json({ otp });
});

router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const entry = otpMap.get(email);

    if (!entry) return res.status(400).json({ msg: 'No OTP sent' });
    if (otp !== entry.code) return res.status(400).json({ msg: 'Invalid OTP' });

    otpMap.delete(email);
    res.json({ msg: 'OTP verified' });
});

router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    await User.findOneAndUpdate({ email }, { password: newPassword });
    res.json({ msg: 'Password reset successful' });
});

router.get('/cart', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ msg: 'Not logged in' });
        }
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const cart = await Cart.findOne({ email: user.email });
        if (!cart) return res.json({ items: [], totalPrice: 0 });

        res.json({ items: cart.items, totalPrice: cart.totalPrice });
    } catch (err) {
        console.error("Cart Fetch Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/cart/add', async (req, res) => {
    try {
        const { email, items, totalPrice } = req.body;

        if (!email || !items || !Array.isArray(items)) {
            return res.status(400).json({ msg: 'Invalid request body' });
        }

        let cart = await Cart.findOne({ email });

        if (!cart) {
            cart = new Cart({ email, items, totalPrice, delivery_status: "ready" }); 
        } else {
            items.forEach(newItem => {
                const existing = cart.items.find(i => i.name === newItem.name);
                if (existing) {
                    existing.quantity += newItem.quantity;
                } else {
                    cart.items.push(newItem);
                }
            });
            cart.totalPrice += totalPrice;
            cart.delivery_status = "ready"; 
        }

        await cart.save();
        res.json({ msg: 'Cart saved' , cart});
    } catch (err) {
        console.error("Cart Add Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/address', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: "Not logged in" });
    const user = await User.findById(req.session.userId);
    res.json({ address: user.address || {} });
});

router.post('/address', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ msg: "Not logged in" });
    await User.findByIdAndUpdate(req.session.userId, { address: req.body });
    res.json({ msg: "Address saved" });
});

module.exports = router;