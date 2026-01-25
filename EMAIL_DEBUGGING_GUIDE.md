# Email Debugging Guide - Forgot Password Email Issue

## Problem
Forgot password emails work in localhost but fail in production (Render backend + Netlify frontend).

## Changes Made

### 1. Enhanced Email Service (`backend/services/emails/sendPasswordResetEmail.js`)
- ✅ Added automatic space removal from email password (common issue in production)
- ✅ Added transporter verification before sending emails
- ✅ Enhanced error logging with detailed information
- ✅ Added connection pool settings for better production performance
- ✅ Exported helper functions for testing

### 2. Improved Forgot Password Controller (`backend/controller/Auth.js`)
- ✅ Added detailed logging at each step
- ✅ Better error handling and reporting
- ✅ Production vs development error handling

### 3. Added Test Endpoint (`/api/v1/auth/test-email-config`)
- ✅ Test email configuration without sending actual password reset
- ✅ Verify transporter connection
- ✅ Send test emails for debugging

## How to Debug in Production

### Step 1: Check Environment Variables in Render
1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to **Environment** tab
4. Verify these variables are set:
   - `EMAIL_USER` = `dev.dreamjobs@gmail.com` (or your Gmail address)
   - `EMAIL_PASS` = `udcsqhzhaewllwyl` (Gmail App Password - **NO SPACES**)
   - `FRONTEND_URL` = `https://findrtechnosis.netlify.app/`
   - `NODE_ENV` = `production`

**IMPORTANT**: The `EMAIL_PASS` should be your Gmail App Password with **NO SPACES**. If you copied it with spaces, remove them in Render's environment variables.

### Step 2: Test Email Configuration
Call the test endpoint to verify your email setup:

```bash
# Test configuration only
GET https://techno-backend-a0s0.onrender.com/api/v1/auth/test-email-config

# Test configuration + send test email
GET https://techno-backend-a0s0.onrender.com/api/v1/auth/test-email-config?testEmail=your@email.com
```

This will return:
- Configuration status (are variables set?)
- Transporter verification (can we connect to Gmail?)
- Test email result (if testEmail parameter provided)

### Step 3: Check Render Logs
1. Go to Render dashboard → Your backend service → **Logs** tab
2. Look for logs starting with `[Email]` or `[ForgotPassword]`
3. Check for error messages with details

### Step 4: Verify Gmail App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification → App passwords
3. Generate a new App Password if needed
4. Copy it **without spaces** to Render's `EMAIL_PASS` variable

## Common Issues and Solutions

### Issue 1: "Invalid login" or "Authentication failed"
**Solution**: 
- Verify `EMAIL_USER` is correct (full Gmail address)
- Verify `EMAIL_PASS` is a Gmail App Password (not regular password)
- Ensure App Password has no spaces in Render
- Make sure 2-Step Verification is enabled on Gmail account

### Issue 2: "Connection timeout" or "ECONNREFUSED"
**Solution**:
- Check Render's network/firewall settings
- Verify Gmail SMTP is accessible (should be by default)
- Check if Render IPs are blocked by Gmail (unlikely but possible)

### Issue 3: Emails sent but not received
**Solution**:
- Check spam/junk folder
- Verify recipient email address
- Check Gmail sending limits (500 emails/day for free accounts)
- Check if Gmail account is suspended

### Issue 4: Works locally but not in production
**Solution**:
- Verify environment variables are set in Render (not just in `.env` file)
- Check that `NODE_ENV=production` is set
- Ensure `FRONTEND_URL` matches your Netlify deployment URL
- Check Render logs for specific error messages

## Testing Checklist

- [ ] Environment variables set in Render
- [ ] Gmail App Password generated and set (no spaces)
- [ ] Test endpoint returns successful verification
- [ ] Test email sent successfully via test endpoint
- [ ] Forgot password API called and logs show email sent
- [ ] Email received in inbox (check spam too)

## Log Format

The enhanced logging will show:
- `[Email Config]` - Configuration and transporter setup
- `[Email]` - Email sending attempts and results
- `[ForgotPassword]` - Password reset flow

Example log output:
```
[Email Config] ✓ Email transporter verified successfully
[ForgotPassword] Attempting to send password reset email: { email: 'user@example.com', ... }
[Email] ✓ Password reset email sent successfully: { messageId: '...', ... }
```

## Next Steps

1. **Deploy the updated code to Render**
2. **Set environment variables correctly** (especially `EMAIL_PASS` without spaces)
3. **Test using the test endpoint** to verify configuration
4. **Check Render logs** when testing forgot password
5. **Monitor email delivery** and check spam folders

## Support

If issues persist after following this guide:
1. Check Render logs for `[Email]` or `[ForgotPassword]` entries
2. Use the test endpoint to isolate the issue
3. Verify Gmail account settings and App Password
4. Check if Gmail has any security alerts or blocks
