const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (email, userName, userRole) => {
  try {
    const mailOptions = {
      from: {
        name: 'Findr Platform',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `Welcome to Findr Platform - ${userRole === 'employer' ? 'Employer' : 'Job Seeker'} Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Findr</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981, #3b82f6);
              color: white;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 24px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981, #3b82f6);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .features {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-item {
              margin: 10px 0;
              padding: 10px;
              background: white;
              border-radius: 6px;
              border-left: 4px solid #10b981;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Findr</div>
              <h1>Welcome to Findr Platform!</h1>
            </div>
            
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>Welcome to Findr Platform! We're excited to have you join our community of ${userRole === 'employer' ? 'employers' : 'job seekers'}.</p>
              
              ${userRole === 'employer' ? `
                <div class="features">
                  <h3>🚀 What you can do as an Employer:</h3>
                  <div class="feature-item">📝 Post job listings and reach qualified candidates</div>
                  <div class="feature-item">👥 Manage applications and shortlist candidates</div>
                  <div class="feature-item">📊 Access HR services and analytics</div>
                  <div class="feature-item">💼 Build your company profile and brand</div>
                </div>
              ` : `
                <div class="features">
                  <h3>🎯 What you can do as a Job Seeker:</h3>
                  <div class="feature-item">🔍 Search and apply for jobs</div>
                  <div class="feature-item">📄 Build your professional profile</div>
                  <div class="feature-item">🎁 Earn rewards and points</div>
                  <div class="feature-item">🤝 Get referrals and recommendations</div>
                </div>
              `}
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Get Started</a>
              </div>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
              
              <p>Best regards,<br>The Findr Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendWelcomeEmail;