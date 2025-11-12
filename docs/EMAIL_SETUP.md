# Email Service Configuration Guide

This guide explains how to configure the email service for password reset functionality in the Social Media Node.js application.

## Overview

The application uses **Nodemailer** with **Gmail SMTP** to send password reset emails. You need to configure Gmail App Passwords for secure authentication.

## Prerequisites

- Gmail account
- Node.js application with environment variables support
- Access to Gmail security settings

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the setup process to enable 2FA (required for App Passwords)

## Step 2: Generate Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. Select **Mail** as the app and **Other (Custom name)** as the device
4. Enter a name like "Social Media App"
5. Click **Generate**
6. **Copy the 16-character password** (you won't see it again)

## Step 3: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password

# Client URL for reset links
CLIENT_URL=http://localhost:3000
```

### Example Configuration

```env
EMAIL_USER=myapp@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
CLIENT_URL=https://myapp.com
```

## Step 4: Verify Configuration

The application automatically validates email configuration on startup:

- ✅ **EMAIL_USER** and **EMAIL_PASS** are present
- ✅ **EMAIL_USER** has valid email format
- ✅ SMTP connection can be established

## Testing Email Service

### Using the API

Send a POST request to test password reset:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Expected Response

**Success (200):**
```json
{
  "statusCode": 200,
  "message": "Password reset link sent to your email successfully",
  "data": {
    "message": "Please check your email for the password reset link",
    "email": "user@example.com"
  }
}
```

**Email Service Error (503):**
```json
{
  "statusCode": 503,
  "message": "Email service temporarily unavailable",
  "error": "Email service authentication failed. Please check EMAIL_USER and EMAIL_PASS configuration."
}
```

## Troubleshooting

### Common Issues

1. **"Invalid login" Error**
   - Verify Gmail App Password is correct
   - Ensure 2FA is enabled on Gmail account
   - Check EMAIL_USER format

2. **"Network error" Error**
   - Check internet connection
   - Verify Gmail SMTP is accessible
   - Try again later

3. **"Email configuration missing" Error**
   - Ensure EMAIL_USER and EMAIL_PASS are in .env file
   - Restart the application after adding variables

### Security Notes

- ✅ Use App Passwords, never your actual Gmail password
- ✅ Keep EMAIL_PASS secure and never commit to version control
- ✅ Use environment variables for all sensitive data
- ✅ Consider using different email providers for production

## Email Template Features

The application includes:

- 📧 **Professional HTML templates** with responsive design
- 📱 **Mobile-friendly** layout
- 🔗 **Clickable reset buttons** and fallback links
- ⏰ **Expiration warnings** (1 hour)
- 📝 **Plain text fallback** for better compatibility

## Production Considerations

### Alternative Email Providers

For production, consider these alternatives:

- **SendGrid** - Reliable transactional email service
- **AWS SES** - Cost-effective for high volume
- **Mailgun** - Developer-friendly API
- **Postmark** - Fast delivery and good analytics

### Environment-Specific Configuration

```env
# Development
EMAIL_USER=dev@gmail.com
CLIENT_URL=http://localhost:3000

# Production
EMAIL_USER=noreply@yourdomain.com
CLIENT_URL=https://yourdomain.com
```

## Support

If you encounter issues:

1. Check the application logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a simple email first
4. Ensure Gmail security settings allow app access

---

**Last Updated:** November 2024
**Version:** 1.0.0
