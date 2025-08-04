const express = require('express');
const router = express.Router();
const nm = require('nodemailer');

function sendOtp(name) {
    return new Promise((resolve, reject) => {
        const trans = nm.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "lax56237@gmail.com",
                pass: "kafd ovwn cnho rbkp" 
            }
        });
        const otp = Math.floor(1000 + Math.random() * 9000);
        const mailOptions = {
            from: "lax56237@gmail.com",
            to: name,
            subject: "Your OTP",
            text: String(otp)
        };

        trans.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("Email error:", err);
                reject(err);
            } else {
                console.log("Email sent: " + info.response);
                resolve({ message: `Email sent on ${name}`, otp });
            }
        });
    });
}

router.post("/method", async (req, res) => {
    const { name } = req.body;

    try {
        const { message, otp } = await sendOtp(name);
        res.json({ message, otp });
    } catch (error) {
        res.status(500).json({ error: "Failed to send email" });
    }
});

module.exports = router;