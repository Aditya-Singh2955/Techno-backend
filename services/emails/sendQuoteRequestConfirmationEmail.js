const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendQuoteRequestConfirmationEmail = async (toEmail, employerName, service, requirements, budget, timeline) => {
  try {
    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: toEmail,
      subject: `Quote Request Received - ${service}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#f9fafb;padding:24px">
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
            <div style="text-align:center;margin-bottom:16px">
              <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:700">Findr</div>
            </div>
            <h2 style="margin:0 0 12px 0;color:#111827">Quote Request Received</h2>
            <p style="color:#374151;margin:0 0 12px 0">Hello ${employerName || 'Employer'}, thanks for requesting a quote. Our team will contact you shortly.</p>
            <div style="background:#f3f4f6;border-left:4px solid #10b981;border-radius:6px;padding:12px 16px;margin:16px 0">
              <div><strong>Service:</strong> ${service}</div>
              ${requirements ? `<div><strong>Requirements:</strong> ${requirements}</div>` : ''}
              ${budget ? `<div><strong>Budget:</strong> ${budget}</div>` : ''}
              ${timeline ? `<div><strong>Timeline:</strong> ${timeline}</div>` : ''}
            </div>
            <div style="text-align:center;margin-top:16px">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer/cart/in-progress" style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">View Requests</a>
            </div>
          </div>
        </div>
      `,
      text: `Your quote request for ${service} has been received. Requirements: ${requirements || 'N/A'}. Budget: ${budget || 'N/A'}. Timeline: ${timeline || 'N/A'}.`
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Quote confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending quote confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendQuoteRequestConfirmationEmail;