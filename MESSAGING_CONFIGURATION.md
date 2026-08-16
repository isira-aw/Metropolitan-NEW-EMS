# Messaging System Configuration Guide

This document provides instructions for configuring the Email and WhatsApp messaging systems in the Metropolitan EMS application.

## Overview

The application now includes a centralized messaging system that supports:
- **Email notifications** via Amazon SES
- **WhatsApp messages** via Facebook WhatsApp Business API

These are used for:
1. Password reset requests
2. Generator owner notifications when tickets are completed

---

## Email Configuration (Amazon SES)

1. **Verify a sender identity** in the AWS SES console (either a single email address or a whole domain) in the region you plan to use. Until your AWS account is out of the SES sandbox, you'll also need to verify recipient addresses for testing.
2. **Create an IAM principal** (user or role) with permission to call `ses:SendEmail` / `ses:SendRawEmail`, scoped to the verified identity if possible.
3. **Provide AWS credentials to the application** via the standard AWS SDK credential chain - `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` environment variables, a shared credentials file, or (recommended for Railway/production) an IAM role attached to the host. Credentials are never stored in `application.properties` or logged.
4. **Set these application properties / environment variables**:
```properties
# Email Configuration (Amazon SES)
aws.ses.region=${AWS_REGION:us-east-1}
aws.ses.sender-email=${SES_SENDER_EMAIL}
```
   - `SES_SENDER_EMAIL` must exactly match a verified SES identity.
   - `AWS_REGION` must be a region where SES is enabled and the sender identity was verified.

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
   export AWS_ACCESS_KEY_ID=your-access-key-id
   export AWS_SECRET_ACCESS_KEY=your-secret-access-key
   export AWS_REGION=us-east-1
   export SES_SENDER_EMAIL=your-verified-sender@example.com
   export WHATSAPP_TOKEN=your-access-token
   ```
   AWS credentials are picked up automatically by the SDK's default credential
   chain - they are never referenced in `application.properties`.

3. Update `application.properties` to use env variables:
   ```properties
   aws.ses.region=${AWS_REGION}
   aws.ses.sender-email=${SES_SENDER_EMAIL}
   whatsapp.api.token=${WHATSAPP_TOKEN}
   ```

4. **Password Requirements**:
   - Minimum 6 characters
   - Stored encrypted using BCrypt
   - No password complexity rules (can be added if needed)

---

## Troubleshooting

### Email Not Sending

1. **Check AWS credentials** are available to the app (env vars, shared credentials file, or IAM role)
2. **Verify the sender identity** (`SES_SENDER_EMAIL`) is verified in the SES console for the configured `AWS_REGION`
3. **Check SES sandbox status** - in the sandbox, recipient addresses must also be verified
4. **Check IAM permissions** - the credentials/role need `ses:SendEmail`
5. **Review logs** for detailed error messages (SES errors surface as `SesException` in the application log)

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
