const nodemailer = require("nodemailer");

// Get email credentials and handle spaces (common issue in production)
const getEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const rawPass = process.env.EMAIL_PASS?.trim() || '';
  const emailPass = rawPass.replace(/\s+/g, ''); // Remove all spaces from password
  
  // Debug logging (don't log full password for security)
  console.log('[Email Config] Credential Check:', {
    hasUser: !!emailUser,
    hasPass: !!emailPass,
    userLength: emailUser?.length || 0,
    passLength: emailPass?.length || 0,
    rawPassLength: rawPass.length,
    userPreview: emailUser ? emailUser.substring(0, 5) + '...' : 'N/A',
    passFirst4: emailPass ? emailPass.substring(0, 4) : 'N/A',
    passLast4: emailPass && emailPass.length >= 4 ? emailPass.substring(emailPass.length - 4) : 'N/A',
    hasSpacesInRaw: rawPass.includes(' '),
    nodeEnv: process.env.NODE_ENV
  });
  
  if (!emailUser || !emailPass) {
    console.error('[Email Config] Missing email credentials:', {
      hasUser: !!emailUser,
      hasPass: !!emailPass,
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  if (emailPass.length !== 16) {
    console.warn(`[Email Config] ⚠️  Warning: App Password should be 16 characters, but got ${emailPass.length} characters`);
    console.warn(`[Email Config] First 4: ${emailPass.substring(0, 4)}, Last 4: ${emailPass.substring(emailPass.length - 4)}`);
    console.warn(`[Email Config] ⚠️  This might cause authentication issues. Please verify your App Password.`);
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
      // Connection timeout settings for Render/production
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Use explicit SMTP settings for better reliability
      host: 'smtp.gmail.com',
      port: 465,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates if needed
      }
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

    console.log('\n📤 ========================================');
    console.log('📤 ATTEMPTING TO SEND PASSWORD RESET EMAIL');
    console.log('📤 ========================================');
    console.log(`📤 To: ${email}`);
    console.log(`📤 From: ${config.user}`);
    console.log(`📤 Reset URL: ${resetUrl.substring(0, 60)}...`);
    console.log(`📤 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('📤 ========================================\n');

    const result = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ ========================================');
    console.log('✅ PASSWORD RESET EMAIL SENT SUCCESSFULLY!');
    console.log('✅ ========================================');
    console.log(`✅ Message ID: ${result.messageId}`);
    console.log(`✅ Response: ${result.response || 'N/A'}`);
    console.log(`✅ To: ${email}`);
    console.log('✅ ========================================\n');
    
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

    console.error('\n❌ ========================================');
    console.error('❌ ERROR SENDING PASSWORD RESET EMAIL');
    console.error('❌ ========================================');
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Code: ${error.code || 'N/A'}`);
    console.error(`❌ Response: ${error.response || 'N/A'}`);
    console.error(`❌ To: ${email}`);
    console.error(`❌ Has EMAIL_USER: ${!!process.env.EMAIL_USER}`);
    console.error(`❌ Has EMAIL_PASS: ${!!process.env.EMAIL_PASS}`);
    console.error(`❌ Password Length: ${process.env.EMAIL_PASS?.length || 0}`);
    
    // Special handling for connection timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  CONNECTION TIMEOUT DETECTED - Possible Issues:');
      console.error('⚠️  1. Render firewall may be blocking SMTP connections');
      console.error('⚠️  2. Gmail SMTP server may be unreachable from Render');
      console.error('⚠️  3. Network configuration issue');
      console.error('⚠️  Solutions:');
      console.error('⚠️  - Check Render network settings');
      console.error('⚠️  - Try using port 465 with secure: true');
      console.error('⚠️  - Consider using a different email service (SendGrid, Mailgun, etc.)');
      console.error('⚠️  - Or use Gmail OAuth2 instead of App Password');
    }
    
    console.error('❌ Full Error Details:');
    console.error(JSON.stringify(errorDetails, null, 2));
    console.error('❌ ========================================\n');
    
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