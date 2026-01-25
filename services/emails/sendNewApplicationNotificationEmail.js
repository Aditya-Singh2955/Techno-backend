const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNewApplicationNotificationEmail = async (email, employerName, jobTitle, applicantName, applicationDate) => {
  try {
    const formattedDate = new Date(applicationDate).toLocaleString();
    const inboxUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer/applicants`;
    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: email,
      subject: `New Application for ${jobTitle}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
            <div style="text-align:center;margin-bottom:16px">
              <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:700">Findr</div>
            </div>
            <h2 style="margin:0 0 12px 0;color:#111827">New Application Received</h2>
            <p style="margin:0 0 16px 0;color:#374151">Hello ${employerName || 'Employer'}, you have received a new application:</p>
            <div style="background:#f3f4f6;border-left:4px solid #3b82f6;border-radius:6px;padding:12px 16px;margin:16px 0">
              <div><strong>Job:</strong> ${jobTitle}</div>
              <div><strong>Applicant:</strong> ${applicantName}</div>
              <div><strong>Applied:</strong> ${formattedDate}</div>
            </div>
            <div style="text-align:center;margin-top:20px">
              <a href="${inboxUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Review Applications</a>
            </div>
          </div>
        </div>
      `,
      text: `New application for ${jobTitle} from ${applicantName} on ${formattedDate}.`
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('New application notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending new application notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendNewApplicationNotificationEmail;