const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendJobNotificationEmail = async (email, jobSeekerName, jobTitle, companyName, location, jobType, jobId) => {
  try {
    const mailOptions = {
      from: {
        name: 'Findr Platform',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `New Job Alert: ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block;">Findr</div>
          </div>
          
          <h2 style="color: #333; text-align: center;">🎯 New Job Opportunity!</h2>
          
          <p>Hello ${jobSeekerName},</p>
          
          <p>We found a new job that matches your profile:</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin-top: 0;">${jobTitle}</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Job Type:</strong> ${jobType}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${jobId}" style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Job Details</a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">This notification was sent because you have job alerts enabled.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Job notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending job notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendJobNotificationEmail;