const nodemailer = require('nodemailer');

// Create transporter
// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: "smtpout.secureserver.net",
//     port: 465, 
//     secure: true, 
//     // requireTLS: true,
//     auth: {
//       user: process.env.EMAIL_USER, 
//       pass: process.env.EMAIL_PASS  
//     },
//   });
// };
createTransporter = () => nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }, // testing only
  logger: true, debug: true
});


// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Findr Platform',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset Request - Findr Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
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
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
            .code {
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 15px;
              font-family: monospace;
              word-break: break-all;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Findr</div>
              <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>We received a request to reset your password for your Findr Platform account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in <strong>15 minutes</strong></li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>For security reasons, this link can only be used once</li>
                </ul>
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <div class="code">${resetUrl}</div>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br>The Findr Team</p>
            </div>
            
            <div class="footer">
              <p>This email was sent from Findr Platform. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Findr Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Findr Platform
        
        Hello ${userName},
        
        We received a request to reset your password for your Findr Platform account.
        
        To reset your password, please visit this link:
        ${resetUrl}
        
        This link will expire in 15 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The Findr Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, userName, userRole) => {
  try {
    const transporter = createTransporter();
    
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

// Send application confirmation email
const sendApplicationConfirmationEmail = async (email, applicantName, jobTitle, companyName, applicationDate) => {
  try {
    const transporter = createTransporter();
    
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

// NEW: Send application status update email
const sendApplicationStatusUpdateEmail = async (email, applicantName, jobTitle, companyName, newStatus, interviewInfo) => {
  try {
    const transporter = createTransporter();

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

// NEW: Send employer job posted confirmation email
const sendJobPostedEmail = async (email, employerName, jobTitle, companyName, jobId) => {
  try {
    const transporter = createTransporter();
    const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer/active-jobs`;
    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: email,
      subject: `Your job is live: ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
            <div style="text-align:center;margin-bottom:16px">
              <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:700">Findr</div>
            </div>
            <h2 style="margin:0 0 12px 0;color:#111827">Job Posted Successfully</h2>
            <p style="margin:0 0 16px 0;color:#374151">Hello ${employerName || 'Employer'}, your job has been posted and is now visible to candidates:</p>
            <div style="background:#f3f4f6;border-left:4px solid #10b981;border-radius:6px;padding:12px 16px;margin:16px 0">
              <div><strong>Job Title:</strong> ${jobTitle}</div>
              <div><strong>Company:</strong> ${companyName}</div>
            </div>
            <div style="text-align:center;margin-top:20px">
              <a href="${jobUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">View Jobs</a>
            </div>
          </div>
        </div>
      `,
      text: `Your job "${jobTitle}" at ${companyName} is now live on Findr.`
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Job posted email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending job posted email:', error);
    return { success: false, error: error.message };
  }
};

// NEW: Send employer notification when a new application is received
const sendNewApplicationNotificationEmail = async (email, employerName, jobTitle, applicantName, applicationDate) => {
  try {
    const transporter = createTransporter();
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

// Send RM Service purchase confirmation email
const sendRMServicePurchaseEmail = async (email, userName, orderDetails) => {
  try {
    const transporter = createTransporter();
    
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

// Send Quote Request confirmation to employer
const sendQuoteRequestConfirmationEmail = async (toEmail, employerName, service, requirements, budget, timeline) => {
  try {
    const transporter = createTransporter();
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

// Notify admin about new quote request (optional)
const sendQuoteRequestAdminNotificationEmail = async (adminEmail, employerName, service, requirements) => {
  try {
    if (!adminEmail) return { success: false, error: 'No admin email configured' };
    const transporter = createTransporter();
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

// Send job notification email to job seekers
const sendJobNotificationEmail = async (email, jobSeekerName, jobTitle, companyName, location, jobType, jobId) => {
  try {
    const transporter = createTransporter();
    const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/search`;
    const jobDetailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobseeker/search?jobId=${jobId}`;
    
    const mailOptions = {
      from: { name: 'Findr Platform', address: process.env.EMAIL_USER },
      to: email,
      subject: `New Job Opportunity: ${jobTitle} at ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Opportunity</title>
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
            .job-card {
              background: #f8fafc;
              border-left: 4px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .job-title {
              font-size: 22px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 10px;
            }
            .job-details {
              color: #6b7280;
              margin: 8px 0;
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
            .footer {
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Findr</div>
              <h1>New Job Opportunity!</h1>
            </div>
            
            <p>Hello ${jobSeekerName || 'Job Seeker'},</p>
            
            <p>We have a new job opportunity that might interest you:</p>
            
            <div class="job-card">
              <div class="job-title">${jobTitle}</div>
              <div class="job-details"><strong>Company:</strong> ${companyName}</div>
              ${location ? `<div class="job-details"><strong>Location:</strong> ${location}</div>` : ''}
              ${jobType ? `<div class="job-details"><strong>Job Type:</strong> ${jobType}</div>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${jobDetailUrl}" class="button">View Job Details</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Don't miss out on this opportunity! Click the button above to view full job details and apply.
            </p>
            
            <div class="footer">
              <p>You're receiving this email because you're registered on Findr Platform.</p>
              <p>Findr Platform - Your Gateway to Career Success in Dubai</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `New Job Opportunity: ${jobTitle} at ${companyName}${location ? ` - ${location}` : ''}. View details at ${jobDetailUrl}`
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('[JobNotificationEmail] Sent to job seeker:', email, 'Job:', jobTitle);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[JobNotificationEmail] Error sending email to:', email, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusUpdateEmail,
  sendJobPostedEmail,
  sendNewApplicationNotificationEmail,
  sendRMServicePurchaseEmail,
  sendQuoteRequestConfirmationEmail,
  sendQuoteRequestAdminNotificationEmail,
  sendJobNotificationEmail
};
