const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendApplicationStatusUpdateEmail = async (email, applicantName, jobTitle, companyName, newStatus, interviewInfo) => {
  try {
    const statusMap = {
      pending: { label: 'Pending Review', color: '#f59e0b' },
      shortlisted: { label: 'Shortlisted', color: '#2563eb' },
      interview_scheduled: { label: 'Interview Scheduled', color: '#10b981' },
      hired: { label: 'Hired', color: '#7c3aed' },
      rejected: { label: 'Rejected', color: '#dc2626' },
      withdrawn: { label: 'Withdrawn', color: '#6b7280' }
    };
    const statusInfo = statusMap[newStatus] || { label: newStatus, color: '#374151' };

    const subjectBase = newStatus === 'interview_scheduled' ? `Interview Scheduled - ${jobTitle}` : `Application Status Updated - ${jobTitle}`;

    const interviewDetailsHtml = newStatus === 'interview_scheduled' && interviewInfo ? `
      <div class="job-details">
        <h3 style="margin-top: 0; color: #10b981;">🗓️ Interview Details</h3>
        ${interviewInfo.date ? `<div class="detail-item"><span class="detail-label">Date & Time:</span><span>${new Date(interviewInfo.date).toLocaleString()}</span></div>` : ''}
        ${interviewInfo.mode ? `<div class="detail-item"><span class="detail-label">Mode:</span><span>${interviewInfo.mode === 'virtual' ? 'Virtual' : 'In-person'}</span></div>` : ''}
      </div>
    ` : '';

    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: email,
      subject: `${subjectBase} at ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            .status { background: #f3f4f6; border-left: 4px solid ${statusInfo.color}; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .detail-item { margin: 10px 0; padding: 8px 0; }
            .detail-label { font-weight: bold; color: #4b5563; margin-right: 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Findr</div>
              <h1>Application Status Updated</h1>
            </div>
            <p>Hello ${applicantName},</p>
            <p>Your application status has been updated for the position <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            <div class="status">
              <div class="detail-item"><span class="detail-label">New Status:</span><span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.label}</span></div>
            </div>
            ${interviewDetailsHtml}
            <div style="text-align: center;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/dashboard" class="button">View Application</a></div>
            <p>Best regards,<br>The Findr Team</p>
            <div class="footer"><p>© ${new Date().getFullYear()} Findr Platform. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
      text: `Your application status for ${jobTitle} at ${companyName} is now ${statusInfo.label}.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Application status update email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending application status update email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendApplicationStatusUpdateEmail;