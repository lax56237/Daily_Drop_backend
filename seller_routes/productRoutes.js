const Product = require('./Product');
const express = require("express");
const router = express.Router();

router.get('/mine', async (req, res) => {
    if (!req.session.user?.sellerId) return res.status(401).json([]);
    const data = await Product.find({ sellerId: req.session.user.sellerId });
    res.json(data);
});

router.post('/add', async (req, res) => {
  if (!req.session.user?.sellerId) return res.status(401).json({ message: "Not authorized" });

  const { name, category, weight, price, quantity, description, imageUrl } = req.body;

  const product = await Product.create({
    name,
    category,
    weight,
    price,
    quantity,
    description,
    sellCount: 0,
    sellerId: req.session.user.sellerId,
    imageUrl,
  });

  res.status(201).json(product);
});

router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i'); 
    const results = await Product.find({ name: regex }).limit(10).select('name');
    res.json(results);
});

router.get('/search-full', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.json([]);
    const regex = new RegExp(q, 'i');
    const data = await Product.find({ name: regex }).lean();

    const formatted = data.map(p => {
        if (p.image) {
            const base64 = Buffer.from(p.image).toString("base64");
            p.imageBase64 = `data:${p.imageType};base64,${base64}`;
        }
        return p;
    });

    res.json(formatted);
});

router.get('/all', async (req, res) => {
  const data = await Product.find({});
  res.json(data);
});

router.get('/top-categories', async (req, res) => {
    try {
        const result = await Product.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 4 }
        ]);
        const categories = result.map(r => r._id);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ msg: "Error fetching categories" });
    }
});

router.get('/top-selling', async (req, res) => {
    try {
        const topProducts = await Product.find().sort({ sellCount: -1 }).limit(15);
        res.json(topProducts);
    } catch (err) {
        res.status(500).json({ msg: "Error fetching products" });
    }
});


module.exports = router;
