const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendApplicationConfirmationEmail = async (email, applicantName, jobTitle, companyName, applicationDate) => {
  try {
    const formattedDate = new Date(applicationDate).toLocaleDateString('en-US', {
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
      subject: `Application Submitted Successfully - ${jobTitle} at ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Confirmation</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0; border: 2px solid #10b981; }
            .job-details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
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
              <h1>Application Submitted Successfully!</h1>
            </div>
            <p>Hello ${applicantName},</p>
            <div class="success-badge">✓ Your application has been submitted successfully!</div>
            <div class="job-details">
              <h3 style="margin-top: 0; color: #10b981;">📋 Application Details</h3>
              <div class="detail-item"><span class="detail-label">Job Position:</span><span>${jobTitle}</span></div>
              <div class="detail-item"><span class="detail-label">Company:</span><span>${companyName}</span></div>
              <div class="detail-item"><span class="detail-label">Application Date:</span><span>${formattedDate}</span></div>
              <div class="detail-item"><span class="detail-label">Status:</span><span style="color: #f59e0b; font-weight: bold;">Pending Review</span></div>
            </div>
            <div class="info-box">
              <strong>💡 What's Next?</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>The employer will review your application</li>
                <li>You'll be notified if you're shortlisted or selected for an interview</li>
                <li>You can track your application status in your dashboard</li>
                <li>You earned <strong>20 reward points</strong> for applying!</li>
              </ul>
            </div>
            <div style="text-align: center;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/dashboard" class="button">View My Applications</a></div>
            <p>Best regards,<br>The Findr Team</p>
            <div class="footer"><p>© ${new Date().getFullYear()} Findr Platform. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
      text: `Application for ${jobTitle} at ${companyName} submitted on ${formattedDate}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Application confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending application confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendApplicationConfirmationEmail;