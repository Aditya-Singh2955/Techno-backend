const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRMServicePurchaseEmail = async (email, userName, orderDetails) => {
  try {
    const formattedDate = new Date(orderDetails.orderDate || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const mailOptions = {
      from: {
        name: 'Findr Platform',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Virtual RM Service Activated - Welcome to Findr Premium!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RM Service Activated</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0; border: 2px solid #10b981; }
            .order-details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
            .detail-item { margin: 10px 0; padding: 8px 0; }
            .detail-label { font-weight: bold; color: #4b5563; margin-right: 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0; }
            .info-box { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 20px 0; color: #1e40af; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Findr</div>
              <h1>Virtual RM Service Activated!</h1>
            </div>
            <p>Hello ${userName},</p>
            <div class="success-badge">✓ Your Virtual RM Service has been successfully activated!</div>
            <div class="order-details">
              <h3 style="margin-top: 0; color: #10b981;">📋 Order Details</h3>
              <div class="detail-item"><span class="detail-label">Service:</span><span>${orderDetails.service || 'Virtual RM Service'}</span></div>
              <div class="detail-item"><span class="detail-label">Original Price:</span><span>AED ${(orderDetails.price || 0).toLocaleString()}</span></div>
              ${orderDetails.pointsUsed > 0 ? `<div class="detail-item"><span class="detail-label">Points Used:</span><span>${orderDetails.pointsUsed} points</span></div>` : ''}
              <div class="detail-item"><span class="detail-label">Amount Paid:</span><span style="color: #10b981; font-weight: bold;">AED ${(orderDetails.totalAmount || 0).toLocaleString()}</span></div>
              <div class="detail-item"><span class="detail-label">Purchase Date:</span><span>${formattedDate}</span></div>
              <div class="detail-item"><span class="detail-label">Status:</span><span style="color: #10b981; font-weight: bold;">Active</span></div>
            </div>
            <div class="info-box">
              <strong>🎉 What's Next?</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Your dedicated Relationship Manager is now assigned to your account</li>
                <li>You'll receive personalized job recommendations and career guidance</li>
                <li>Your RM will help optimize your profile and improve your job search</li>
                <li>You earned <strong>100 reward points</strong> for purchasing the RM Service!</li>
                <li>Access your RM dashboard to track your progress and get support</li>
              </ul>
            </div>
            <div style="text-align: center;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/virtual-rm" class="button">View My RM Service</a></div>
            <p>Thank you for choosing Findr Premium Services. We're excited to help you achieve your career goals!</p>
            <p>Best regards,<br>The Findr Team</p>
            <div class="footer"><p>© ${new Date().getFullYear()} Findr Platform. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
      text: `Your Virtual RM Service has been activated on ${formattedDate}. Order total: AED ${(orderDetails.totalAmount || 0).toLocaleString()}.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('RM Service purchase confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending RM Service purchase confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendRMServicePurchaseEmail;