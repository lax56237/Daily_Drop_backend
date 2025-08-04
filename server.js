// const express = require('express');
// const app = express();
// const PORT = 5000;
// const cors = require("cors");

// const OTP = require('./seller_routes/otp.js');
// const AUTH = require('./seller_routes/auth');
// const session = require('express-session');
// const sellerRoutes = require('./seller_routes/sellerRoutes');
// const product = require('./seller_routes/productRoutes');
// const userRoutes = require('./user_routes/userRoutes.js');
// const deliveryRoutes = require('./dilivery_routes/deliveryRoutes');

// const allowedOrigins = [
//     "https://daily-drop-user.onrender.com",
//     "https://daily-drop-delivery.onrender.com",
//     "https://daily-drop-seller.onrender.com",
//     "http://localhost:3000",
//     "http://localhost:5173"
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     credentials: true
// }));3
// app.use(express.json());
// app.use(session({
//     secret: 'my-secret-key',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
// }));

// app.use('/otp', OTP);
// app.use('/auth', AUTH);
// app.use('/seller', sellerRoutes);
// app.use('/user', userRoutes);
// app.use('/products', product);
// app.use('/delivery', deliveryRoutes);
// app.get('/', (req, res) => {
//     res.send('backend is running!');
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
const express = require('express');
const app = express();
const PORT = 5000;
const cors = require("cors");

const OTP = require('./seller_routes/otp.js');
const AUTH = require('./seller_routes/auth');
const session = require('express-session');
const sellerRoutes = require('./seller_routes/sellerRoutes');
const product = require('./seller_routes/productRoutes');
const userRoutes = require('./user_routes/userRoutes.js');
const deliveryRoutes = require('./dilivery_routes/deliveryRoutes');

const allowedOrigins = [
    "https://daily-drop-user.onrender.com",
    "https://daily-drop-delivery.onrender.com",
    "https://daily-drop-seller.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
];

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Additional middleware to handle preflight requests explicitly
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

app.use(express.json());
app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use('/otp', OTP);
app.use('/auth', AUTH);
app.use('/seller', sellerRoutes);
app.use('/user', userRoutes);
app.use('/products', product);
app.use('/delivery', deliveryRoutes);

app.get('/', (req, res) => {
    res.send('backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});