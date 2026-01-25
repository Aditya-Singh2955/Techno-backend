const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP Code - Password Reset",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 400px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
  
    <!-- Logo -->
    <div style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block; margin-bottom: 20px;">Findr</div>
  
    <!-- Title -->
    <h2 style="color: #333; font-size: 20px; margin-bottom: 10px;">🔐 Your One-Time Password</h2>
  
    <!-- Instruction -->
    <p style="color: #555; font-size: 14px;">Use the code below to reset your password:</p>
  
    <!-- OTP -->
    <h1 style="color: #4CAF50; font-size: 36px; margin: 20px 0;">${otp}</h1>
  
    <!-- Footer -->
    <p style="color: #888; font-size: 12px;">This code will expire in 10 minutes.</p>
  </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendOTPEmail;