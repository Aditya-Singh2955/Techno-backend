const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendQuoteRequestAdminNotificationEmail = async (adminEmail, employerName, service, requirements) => {
  try {
    if (!adminEmail) return { success: false, error: 'No admin email configured' };
    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: adminEmail,
      subject: `New Quote Request - ${service}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9fafb;padding:24px">
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
            <h2 style="margin:0 0 12px 0;color:#111827">New Quote Request</h2>
            <div style="background:#f3f4f6;border-left:4px solid #3b82f6;border-radius:6px;padding:12px 16px;margin:16px 0">
              <div><strong>Employer:</strong> ${employerName || 'Unknown'}</div>
              <div><strong>Service:</strong> ${service}</div>
              ${requirements ? `<div><strong>Requirements:</strong> ${requirements}</div>` : ''}
            </div>
          </div>
        </div>
      `,
      text: `New quote request from ${employerName || 'Unknown'} for ${service}. Requirements: ${requirements || 'N/A'}.`
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Quote admin notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending quote admin notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendQuoteRequestAdminNotificationEmail;