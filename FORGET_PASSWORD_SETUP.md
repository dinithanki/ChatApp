# Forget Password Feature - Setup Guide

## Overview

The forget password feature allows users to reset their password via email. The system uses nodemailer to send reset links that expire after 10 minutes.

## Required Environment Variables

### Backend (.env file)

```
# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Frontend URL (for password reset link)
FRONTEND_URL=http://localhost:5173
```

### How to Set Up Gmail App Password

1. **Enable 2-Factor Authentication on Gmail**
   - Go to myaccount.google.com
   - Select "Security" from the left menu
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device type)
   - Google will generate a 16-character password
   - Copy this password and use it as `EMAIL_PASSWORD` in your .env file

3. **Email User**
   - Use your full Gmail address as `EMAIL_USER`
   - Example: `your_email@gmail.com`

### Alternative: Using Other Email Services

If you prefer to use other email services (SendGrid, Mailgun, etc.), update the nodemailer configuration in `backend/src/controllers/auth.controller.js`:

**For SendGrid:**

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

**For Mailgun:**

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MAILGUN_EMAIL,
    pass: process.env.MAILGUN_PASSWORD,
  },
});
```

## Features

### Forgot Password (/forgot-password)

- User enters their email
- Backend validates the email exists
- Generates a unique reset token (valid for 10 minutes)
- Sends an email with a reset link

### Reset Password (/reset-password/:token)

- User receives email with reset link
- Clicking the link takes them to reset password page
- User enters new password and confirmation
- System validates and updates the password
- User is redirected to login

## API Endpoints

### POST /api/auth/forgot-password

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Reset link sent to your email"
}
```

### POST /api/auth/reset-password/:token

**Request:**

```json
{
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**

```json
{
  "message": "Password reset successful. You can now login with your new password."
}
```

## Installation Steps

1. **Install Dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Create .env file**

   ```bash
   cp .env.example .env
   ```

3. **Add Gmail Credentials**
   - Follow the Gmail setup steps above
   - Update EMAIL_USER and EMAIL_PASSWORD in .env

4. **Start the server**
   ```bash
   npm run dev
   ```

## Frontend Routes

- `/forgot-password` - Forgot password form
- `/reset-password/:token` - Reset password form with token validation

## Security Features

1. **Token Hashing** - Reset tokens are hashed before storing in database
2. **Token Expiration** - Tokens expire after 10 minutes
3. **Password Requirements** - Minimum 6 characters
4. **Email Verification** - Link is sent to user's registered email
5. **One-time Use** - Token is cleared after successful password reset

## Troubleshooting

### "Invalid or expired reset token"

- The link has expired (10 minute limit)
- Request a new reset link

### "Failed to send reset email"

- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail App Password is correct
- Check if 2-Factor Authentication is enabled
- Make sure "Less secure app access" is not blocking

### Email not received

- Check spam/junk folder
- Verify email address is correct
- Wait 30 seconds and check again
- Request a new reset link if expired

## Testing

You can test the feature locally:

1. Navigate to http://localhost:5173/forgot-password
2. Enter your test email
3. Check your email for the reset link
4. Click the link and set a new password
5. Login with your new password
