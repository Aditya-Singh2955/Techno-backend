const express = require("express");
const app = express();
const cors = require("cors");
const Stripe = require('stripe');

require("dotenv").config();
const PORT = process.env.PORT || 4000;


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
    // Items example: you would compute the amount server-side from your DB/cart
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: req.body.items || [
        { price_data: {
            currency: 'aed',
            product_data: { name: 'Findr Premium Service' },
            unit_amount: 2500
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`App is Listening at ${PORT}`);
});