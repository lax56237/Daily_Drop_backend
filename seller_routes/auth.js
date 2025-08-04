const express = require('express');
const router = express.Router();
const Seller = require('./seller');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    try {
        const seller = await Seller.findOne({ username: email, password });

        if (!seller) {
            return res.status(404).json({ success: false, message: 'No user found' });
        }

        req.session.user = { email, sellerId: seller._id };
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24;

        return res.json({ success: true, message: 'Login successful' });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/check', (req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    } else {
        return res.status(401).json({ loggedIn: false });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

module.exports = router;