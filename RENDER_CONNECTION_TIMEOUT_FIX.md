# Render Connection Timeout Fix - Gmail SMTP

## Current Issue
```
Error: Connection timeout
Code: ETIMEDOUT
Command: CONN
```

This means Render cannot connect to Gmail's SMTP server (`smtp.gmail.com`).

## Root Causes

### 1. **Password Length Issue** ⚠️
Your logs show:
```
emailPassLength: 19
```

Gmail App Passwords should be **exactly 16 characters**. A 19-character password suggests:
- Extra characters were copied
- Password format is incorrect
- Not a valid App Password

**Fix**: Generate a new App Password and ensure it's exactly 16 characters.

### 2. **Render Network Restrictions** 🔒
Render may block outbound SMTP connections on certain ports or IPs.

### 3. **Gmail SMTP Blocking** 🚫
Gmail might be blocking connections from Render's IP addresses.

## Solutions

### Solution 1: Fix App Password (CRITICAL)

1. **Generate a NEW App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Generate for "Mail"
   - Copy the **16-character** password (no spaces)

2. **Update Render Environment Variables**:
   - Go to Render Dashboard → Your Service → Environment
   - Update `EMAIL_PASS` with the new 16-character password
   - Make sure `EMAIL_USER` is correct
   - Save and redeploy

### Solution 2: Use Port 465 (More Reliable)

The code now uses port 587. Try port 465 instead:

Update `sendPasswordResetEmail.js`:
```javascript
port: 465,
secure: true, // true for 465
```

### Solution 3: Use Alternative Email Service (Recommended for Production)

Consider using a production email service instead of Gmail:

#### Option A: SendGrid (Recommended)
- Free tier: 100 emails/day
- Better deliverability
- No connection issues
- Easy setup

#### Option B: Mailgun
- Free tier: 5,000 emails/month
- Great for production
- Reliable SMTP

#### Option C: AWS SES
- Very cheap ($0.10 per 1,000 emails)
- Highly reliable
- Production-ready

### Solution 4: Use Gmail OAuth2 (More Secure)

Instead of App Passwords, use OAuth2:
- More secure
- No connection issues
- Better for production

## Quick Fix Steps

1. **Check Password Length**:
   ```bash
   # In Render logs, check:
   emailPassLength: 16  # Should be 16, not 19
   ```

2. **Generate New App Password**:
   - Must be exactly 16 characters
   - No spaces
   - Generated for "Mail" app

3. **Update Render Environment**:
   - Set `EMAIL_PASS` to new 16-character password
   - Redeploy service

4. **Test Connection**:
   ```bash
   # Use test endpoint
   GET https://your-render-url/api/v1/auth/test-email-config
   ```

## Testing

After fixing, check logs for:
- ✅ `emailPassLength: 16` (not 19)
- ✅ `[Email Config] ✓ Email transporter verified successfully`
- ✅ No `ETIMEDOUT` errors

## If Still Timing Out

If connection timeout persists after fixing password:

1. **Check Render Network Settings**:
   - Some Render plans have network restrictions
   - Contact Render support

2. **Try Different Port**:
   - Port 465 (SSL) instead of 587 (TLS)
   - Update code to use `port: 465, secure: true`

3. **Use Alternative Service**:
   - SendGrid, Mailgun, or AWS SES
   - More reliable for production

## Current Configuration Check

From your logs:
- ✅ `EMAIL_USER`: Set (contact.naazessence@gmail.com)
- ❌ `EMAIL_PASS`: 19 characters (should be 16)
- ❌ Connection timeout to Gmail SMTP

**Action Required**: Fix the password length first, then test again.
