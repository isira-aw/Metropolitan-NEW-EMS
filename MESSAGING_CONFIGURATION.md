# Messaging System Configuration Guide

This document provides instructions for configuring the Email and WhatsApp messaging systems in the Metropolitan EMS application.

## Overview

The application now includes a centralized messaging system that supports:
- **Email notifications** via SMTP
- **WhatsApp messages** via Facebook WhatsApp Business API

These are used for:
1. Password reset requests
2. Generator owner notifications when tickets are completed

---

## Email Configuration

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings > Security
   - Under "2-Step Verification", select "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update `application.properties`**:
```properties
# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-16-char-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### Alternative SMTP Providers

**SendGrid:**
```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=YOUR_SENDGRID_API_KEY
```

**AWS SES:**
```properties
spring.mail.host=email-smtp.us-east-1.amazonaws.com
spring.mail.port=587
spring.mail.username=YOUR_SMTP_USERNAME
spring.mail.password=YOUR_SMTP_PASSWORD
```

---

## WhatsApp Business API Configuration

### Prerequisites

1. **Facebook Business Account**
2. **WhatsApp Business Account** linked to your Facebook Business Account
3. **Meta for Developers App** with WhatsApp Business API enabled

### Setup Steps

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing
   - Add "WhatsApp" product to your app

2. **Get Your Credentials**:
   - **Phone Number ID**: Found in WhatsApp > API Setup
   - **Access Token**: Generate a permanent token from App Dashboard > WhatsApp > API Setup
   - **Verify Token**: Create a custom verification token (any random string)

3. **Update `application.properties`**:
```properties
# WhatsApp Configuration
whatsapp.api.url=https://graph.facebook.com/v18.0
whatsapp.api.token=YOUR_PERMANENT_ACCESS_TOKEN
whatsapp.phone.number.id=YOUR_PHONE_NUMBER_ID
whatsapp.verify.token=YOUR_CUSTOM_VERIFY_TOKEN_123
```

### Getting Permanent Access Token

Temporary tokens expire after 24 hours. To get a permanent token:

1. Go to **App Dashboard > WhatsApp > Configuration**
2. Under "Temporary access token", click "Generate token"
3. Copy the token
4. Use the System User token (permanent) instead:
   - Go to **Business Settings > System Users**
   - Create a new system user or use existing
   - Assign the user to your app with "WhatsApp Business Management" permission
   - Generate a new token for the system user
   - This token is permanent and won't expire

### Testing WhatsApp Integration

Send a test message using the API:
```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "1234567890",
    "type": "text",
    "text": {
      "body": "Test message from Metropolitan EMS"
    }
  }'
```

---

## Application Configuration

### Frontend URL Configuration

Set the frontend URL for password reset links:
```properties
app.frontend.url=http://localhost:3000
```

For production:
```properties
app.frontend.url=https://your-domain.com
```

### Password Reset Token Expiry

Configure token expiry time (in minutes):
```properties
app.password.reset.token.expiry.minutes=15
```

---

## Feature Usage

### 1. Forgot Password Flow

**User Perspective:**
1. User clicks "Forgot Password?" on login page
2. Enters email or phone number
3. Receives password reset link via Email and/or WhatsApp
4. Clicks link and sets new password
5. Redirected to login page

**System Behavior:**
- Token expires after 15 minutes (configurable)
- Token is one-time use only
- Generic success message prevents user enumeration
- Supports both email and phone number lookup

### 2. Generator Owner Notifications

**Trigger Conditions:**
- Ticket status changes to COMPLETED
- All mini job cards for the ticket are completed
- Notification sent ONLY AFTER ticket is fully cleared

**Notification Content:**
- Ticket reference number
- Generator ID/Name
- Completion confirmation
- Summary of work done (service type, description, employee details)

**Delivery Channels:**
- Email (if owner email is set)
- WhatsApp (if owner WhatsApp number is set)
- Both channels if both are configured

---

## Security Notes

1. **Never commit real credentials** to version control
2. Use **environment variables** for production:
   ```bash
   export MAIL_USERNAME=your-email@gmail.com
   export MAIL_PASSWORD=your-app-password
   export WHATSAPP_TOKEN=your-access-token
   ```

3. Update `application.properties` to use env variables:
   ```properties
   spring.mail.username=${MAIL_USERNAME}
   spring.mail.password=${MAIL_PASSWORD}
   whatsapp.api.token=${WHATSAPP_TOKEN}
   ```

4. **Password Requirements**:
   - Minimum 6 characters
   - Stored encrypted using BCrypt
   - No password complexity rules (can be added if needed)

---

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials** are correct
2. **Verify app password** is generated correctly
3. **Check firewall** allows outbound SMTP (port 587)
4. **Review logs** for detailed error messages

### WhatsApp Not Sending

1. **Verify access token** is valid and permanent
2. **Check phone number format** (must be international format without +)
3. **Ensure WhatsApp number** is verified in Meta Business Account
4. **Review API response** in application logs
5. **Check rate limits** on Meta API

### Password Reset Link Not Working

1. **Check frontend URL** configuration
2. **Verify token hasn't expired** (15 minutes default)
3. **Ensure token hasn't been used** (one-time use)
4. **Check token in database** (password_reset_tokens table)

---

## Database Schema

### password_reset_tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);
```

### Automatic Cleanup

Expired tokens are automatically deleted daily at 2:00 AM via scheduled task.

---

## Support

For issues or questions:
- Review application logs for detailed error messages
- Check Meta for Developers documentation for WhatsApp API
- Verify Gmail SMTP settings for email issues
