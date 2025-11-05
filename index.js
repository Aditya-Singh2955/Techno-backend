const express = require("express");
const app = express();
const cors = require("cors");
const Stripe = require('stripe');

require("dotenv").config();
const PORT = process.env.PORT || 4000;

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


app.use(cors({
  origin: "*",
  credentials: false
}));

app.use(express.json());

require("./config/database").connect();

const user = require("./route/User");
const upload = require("./route/upload");
const job = require("./route/job");
const employer = require("./route/employer");
const application = require("./route/application");
const admin = require("./route/admin");
const quote = require("./route/quote");
const order = require("./route/order");

app.use("/api/v1", user);
app.use("/api/v1", upload);
app.use("/api/v1", job);
app.use("/api/v1", employer);
app.use("/api/v1", application);
app.use("/api/v1", admin);
app.use("/api/v1", quote);
app.use("/api/v1", order);

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, metadata } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      metadata: metadata || {},
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/payment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/cart`,
    });
    
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`App is Listening at ${PORT}`);
});