const nodemailer = require("nodemailer");

// Get email credentials and handle spaces (common issue in production)
const getEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, ''); // Remove all spaces from password
  
  if (!emailUser || !emailPass) {
    console.error('[Email Config] Missing email credentials:', {
      hasUser: !!emailUser,
      hasPass: !!emailPass,
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  return {
    user: emailUser,
    pass: emailPass
  };
};

// Create transporter with better error handling
const createTransporter = () => {
  try {
    const config = getEmailConfig();
    
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: config.user,
        pass: config.pass,
      },
      // Add timeout and connection pool settings for production
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      rateDelta: 1000,
      rateLimit: 5,
    });

    return transporter;
  } catch (error) {
    console.error('[Email Config] Failed to create transporter:', error.message);
    throw error;
  }
};

// Verify transporter connection (call this once on startup or before sending)
const verifyTransporter = async (transporter) => {
  try {
    const config = getEmailConfig();
    await transporter.verify();
    console.log('[Email Config] ✓ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('[Email Config] ✗ Email transporter verification failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  let transporter;
  
  try {
    // Validate email input
    if (!email || !resetToken) {
      throw new Error('Email and reset token are required');
    }

    // Create transporter
    transporter = createTransporter();
    
    // Verify connection before sending (optional but helpful for debugging)
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      console.warn('[Email] Transporter verification failed, but attempting to send anyway...');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/reset-password?token=${resetToken}`;
    const config = getEmailConfig();
    
    const mailOptions = {
      from: {
        name: 'Findr Platform',
        address: config.user
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

    console.log('[Email] Attempting to send password reset email:', {
      to: email,
      from: config.user,
      resetUrl: resetUrl.substring(0, 50) + '...',
      nodeEnv: process.env.NODE_ENV
    });

    const result = await transporter.sendMail(mailOptions);
    
    console.log('[Email] ✓ Password reset email sent successfully:', {
      messageId: result.messageId,
      response: result.response,
      to: email
    });
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    // Detailed error logging for production debugging
    const errorDetails = {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      to: email,
      nodeEnv: process.env.NODE_ENV,
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      emailUserLength: process.env.EMAIL_USER?.length || 0,
      emailPassLength: process.env.EMAIL_PASS?.length || 0
    };

    console.error('[Email] ✗ Error sending password reset email:', JSON.stringify(errorDetails, null, 2));
    
    // Return more detailed error information for debugging
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code,
      errorResponse: error.response,
      errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    };
  } finally {
    // Close transporter connection if it was created
    if (transporter && transporter.close) {
      transporter.close();
    }
  }
};

// Export both the function and helper functions for testing
module.exports = sendPasswordResetEmail;
module.exports.verifyTransporter = verifyTransporter;
module.exports.createTransporter = createTransporter;
module.exports.getEmailConfig = getEmailConfig;