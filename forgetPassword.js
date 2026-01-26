const nodemailer = require("nodemailer");

// 🔹 Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ''), // gmail app password (remove spaces)
  },
});


const sendPasswordResetEmail = async (email, resetToken, name = "User") => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return {
        success: false,
        error: "Email credentials not configured"
      };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/reset-password?token=${resetToken}`;
    
    const info = await transporter.sendMail({
      from: `"Findr Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - Findr",
      text: `Hello ${name},

We received a request to reset your password for your Findr account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes.

If you didn't request a password reset, please ignore this email or contact support.

Best regards,
The Findr Team`,
    });

    console.log('Password reset email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Password reset email error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendPasswordResetEmail,
};
