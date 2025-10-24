      # Email Configuration Guide

## Setting up Nodemailer for Findr Platform

### 1. Install Nodemailer
```bash
cd backend
npm install nodemailer
```

### 2. Environment Variables
Add these variables to your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
FRONTEND_URL=http://localhost:3000
```

### 3. Gmail Setup (Recommended)

#### Option A: App Password (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security
3. Generate an "App Password" for "Mail"
4. Use this app password as `EMAIL_PASS`

#### Option B: Less Secure Apps (Not Recommended)
1. Go to Google Account Settings > Security
2. Turn on "Less secure app access"
3. Use your regular Gmail password as `EMAIL_PASS`

### 4. Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### 5. Testing Email Configuration

#### Test the forgot password email:
```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

#### Check the console for:
- "Password reset email sent successfully: [message-id]"
- Any error messages

### 6. Email Templates

The system includes:
- **Password Reset Email**: Professional HTML template with reset link
- **Welcome Email**: Welcome message for new users

### 7. Troubleshooting

#### Common Issues:
1. **"Invalid login"**: Check your email credentials
2. **"Less secure app access"**: Enable 2FA and use app password
3. **"Connection timeout"**: Check your internet connection
4. **"Authentication failed"**: Verify your email and password

#### Debug Mode:
Set `NODE_ENV=development` to see reset URLs in the console for testing.

### 8. Production Considerations

- Use a dedicated email service (SendGrid, Mailgun, etc.)
- Set up proper SPF, DKIM, and DMARC records
- Monitor email delivery rates
- Consider email templates with your branding
