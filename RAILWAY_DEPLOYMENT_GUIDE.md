# Railway Deployment Guide for Metropolitan EMS

## Table of Contents
1. [Server Location Impact](#server-location-impact)
2. [Timezone Configuration](#timezone-configuration)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Railway Deployment Steps](#railway-deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Server Location Impact

### ✅ FIXED: Server Location No Longer Affects Functionality

**Previous Issue:** The application had 17+ hardcoded timezone references (`Asia/Colombo`) that would break if the server wasn't in Sri Lanka.

**Solution Implemented:**
- Created `TimeZoneConfig` class for centralized timezone management
- Made timezone configurable via `APP_TIMEZONE` environment variable
- Refactored all services to use configured timezone instead of hardcoded values

**Result:** ✅ **The application will work correctly regardless of Railway server location** as long as `APP_TIMEZONE=Asia/Colombo` is set.

### How It Works Now

The system now gets the timezone from configuration:
```java
// Backend (Java)
@Autowired
private TimeZoneConfig timeZoneConfig;

LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
```

```typescript
// Frontend (TypeScript)
import { getTodayInTimezone } from '@/lib/config/timezone';

const today = getTodayInTimezone();
```

### Business Functions That Depend on Correct Timezone

| Feature | Impact of Wrong Timezone | Fixed? |
|---------|-------------------------|--------|
| Attendance Check-in/out | Employees can't check in/out at correct times | ✅ Yes |
| Ticket Status Updates | Tickets locked/unlocked at wrong times | ✅ Yes |
| Score Assignment | Performance scoring timestamped incorrectly | ✅ Yes |
| Monthly Statistics | Reports show wrong month boundaries | ✅ Yes |
| Dashboard Stats | Real-time stats calculated for wrong day | ✅ Yes |
| Approval Filtering | "Today" filter shows wrong date | ✅ Yes |

---

## Timezone Configuration

### Critical Configuration

**Backend:** Set in Railway environment variables
```bash
APP_TIMEZONE=Asia/Colombo
```

**Frontend:** Set in Railway environment variables
```bash
NEXT_PUBLIC_TIMEZONE=Asia/Colombo
```

### Why Asia/Colombo Regardless of Server Location?

1. **Business Logic:** All attendance, tickets, and reports are based on Sri Lankan business hours (8:30 AM - 5:30 PM Sri Lanka time)
2. **User Expectations:** Users expect dates/times in Sri Lankan timezone
3. **Working Hours Calculation:** Overtime is calculated based on Sri Lankan standard hours
4. **Monthly Reports:** Month boundaries must align with Sri Lankan dates

**The server can be anywhere in the world** - as long as `APP_TIMEZONE=Asia/Colombo`, all calculations will be correct.

---

## Pre-Deployment Checklist

### 🔴 Critical (Must Complete Before Deployment)

- [x] ✅ Remove hardcoded timezones (completed in this update)
- [x] ✅ Make timezone configurable via environment variables
- [x] ✅ Update application.properties to use env vars
- [ ] Generate new JWT secret for production
- [ ] Prepare production database credentials
- [ ] Prepare production email credentials
- [ ] Review and update CORS configuration
- [ ] Test all environment variables locally

### 🟡 Recommended

- [ ] Set up database backups
- [ ] Configure monitoring/logging service
- [ ] Create health check endpoint
- [ ] Document environment-specific configurations
- [ ] Plan rollback strategy

### 🟢 Optional

- [ ] Set up CI/CD pipeline
- [ ] Configure custom domain
- [ ] Set up SSL certificate (Railway provides free SSL)
- [ ] Enable database connection pooling

---

## Environment Variables Setup

### Required Environment Variables

Copy `.env.example` to `.env` and fill in your values. For Railway, set these in the dashboard.

#### Backend Service (Spring Boot)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://host:5432/db` | ✅ Yes | Railway provides this |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | ✅ Yes | Railway provides this |
| `SPRING_DATASOURCE_PASSWORD` | `secure-password` | ✅ Yes | Railway provides this |
| `JWT_SECRET` | `base64-encoded-256bit-key` | ✅ Yes | Generate new for production |
| `APP_TIMEZONE` | `Asia/Colombo` | ✅ Yes | **Critical for correct operation** |
| `SPRING_MAIL_USERNAME` | `your-email@gmail.com` | ✅ Yes | For notifications |
| `SPRING_MAIL_PASSWORD` | `gmail-app-password` | ✅ Yes | Gmail app password |
| `APP_FRONTEND_URL` | `https://your-app.railway.app` | ✅ Yes | For CORS |
| `WHATSAPP_API_TOKEN` | `your-token` | ❌ No | Optional feature |

#### Frontend Service (Next.js)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://backend.railway.app` | ✅ Yes | Backend URL |
| `NEXT_PUBLIC_TIMEZONE` | `Asia/Colombo` | ✅ Yes | Must match backend |

### Generating Secure JWT Secret

```bash
# Generate a 256-bit (32-byte) secret
openssl rand -base64 32

# Or generate a 512-bit (64-byte) secret (recommended)
openssl rand -base64 64
```

⚠️ **IMPORTANT:** Never use the default JWT secret in production!

---

## Railway Deployment Steps

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the repository

### Step 2: Add PostgreSQL Database

1. Click "New" → "Database" → "PostgreSQL"
2. Railway will auto-generate database credentials
3. Note: Railway provides `DATABASE_URL` automatically

### Step 3: Create Backend Service

1. Click "New" → "GitHub Repo"
2. Select your repository
3. Configure the service:

**Settings:**
- **Name:** `ems-backend`
- **Root Directory:** Leave empty (build command will cd into back-e)

**Build Configuration:**
```bash
Build Command: cd back-e && mvn clean package -DskipTests
```

**Deploy Configuration:**
```bash
Start Command: java -jar back-e/target/ems-backend-0.0.1-SNAPSHOT.jar
```

**Environment Variables:** (Set in Variables tab)
```env
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<your-generated-secret>
APP_TIMEZONE=Asia/Colombo
SPRING_MAIL_USERNAME=<your-email>
SPRING_MAIL_PASSWORD=<your-app-password>
APP_FRONTEND_URL=<will-set-after-frontend-deployed>
```

**Networking:**
- Railway will auto-assign a public URL
- Note this URL for frontend configuration

### Step 4: Create Frontend Service

1. Click "New" → "GitHub Repo" (same repo)
2. Configure the service:

**Settings:**
- **Name:** `ems-frontend`
- **Root Directory:** Leave empty

**Build Configuration:**
```bash
Build Command: cd front-e && npm install && npm run build
```

**Deploy Configuration:**
```bash
Start Command: cd front-e && npm start
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=<backend-url-from-step3>
NEXT_PUBLIC_TIMEZONE=Asia/Colombo
```

**Networking:**
- Note the public URL
- Go back to backend and update `APP_FRONTEND_URL` with this URL

### Step 5: Configure Database Connection

Railway automatically links PostgreSQL to your services. Verify:

1. Go to PostgreSQL service
2. Click "Variables" tab
3. Ensure connection variables are exposed
4. Backend should reference them as shown in Step 3

### Step 6: Deploy

1. Railway auto-deploys on push to main branch
2. Monitor deployment logs in Railway dashboard
3. Check for any errors during build/startup

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Backend health (replace with your backend URL)
curl https://your-backend.railway.app/actuator/health

# Or test a public endpoint
curl https://your-backend.railway.app/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 2. Timezone Verification

Test that the timezone is working correctly:

1. **Backend:** Check application logs for startup messages
2. **Frontend:** Test the "Today" button on approvals page
3. **Attendance:** Try checking in - verify it uses correct date
4. **Tickets:** Create a ticket for "today" - verify date is correct

### 3. Database Connection

1. Check backend logs for successful database connection
2. Try logging in to verify database queries work
3. Create test attendance record to verify writes work

### 4. Email Notifications

1. Test password reset functionality
2. Check email delivery
3. Verify email links point to correct frontend URL

### 5. CORS Configuration

1. Open frontend URL in browser
2. Try logging in
3. Verify API calls are not blocked by CORS
4. Check browser console for CORS errors

---

## Troubleshooting

### Issue: Wrong Dates/Times Showing

**Symptom:** Attendance dates, ticket dates, or reports show incorrect dates

**Solution:**
1. Verify `APP_TIMEZONE=Asia/Colombo` is set in backend environment variables
2. Verify `NEXT_PUBLIC_TIMEZONE=Asia/Colombo` is set in frontend
3. Check application logs for timezone initialization
4. Restart both services after setting variables

**Verification:**
```bash
# Check backend logs for timezone
# Should show: "Using timezone: Asia/Colombo"
```

### Issue: CORS Errors

**Symptom:** Frontend can't connect to backend, browser shows CORS errors

**Solution:**
1. Verify `APP_FRONTEND_URL` is set to your Railway frontend URL
2. Include protocol: `https://your-app.railway.app` (not `your-app.railway.app`)
3. No trailing slash in URL
4. Restart backend service after updating

### Issue: Database Connection Failed

**Symptom:** Backend fails to start with database connection errors

**Solution:**
1. Verify PostgreSQL service is running
2. Check database environment variables are set correctly
3. Use Railway's auto-generated `DATABASE_URL` or individual vars
4. Format: `jdbc:postgresql://host:port/database`

### Issue: Authentication Not Working

**Symptom:** Can't login, token errors

**Solution:**
1. Verify `JWT_SECRET` is set (minimum 256 bits)
2. Check JWT expiration times are reasonable
3. Clear browser local storage and try again
4. Check backend logs for JWT validation errors

### Issue: Email Not Sending

**Symptom:** Password reset emails not received

**Solution:**
1. Verify Gmail credentials are correct
2. Use Gmail **App Password**, not regular password
3. Enable "Less secure app access" if using regular password (not recommended)
4. Check backend logs for SMTP errors
5. Test SMTP connection:
```bash
# From Railway backend shell
telnet smtp.gmail.com 587
```

### Issue: Build Failures

**Symptom:** Railway deployment fails during build

**Backend Build Failure:**
```bash
# Check Maven version, Java version
# Ensure pom.xml is valid
# Try building locally first
cd back-e && mvn clean package
```

**Frontend Build Failure:**
```bash
# Check Node version (should be 20.x)
# Ensure package.json is valid
# Try building locally first
cd front-e && npm install && npm run build
```

### Issue: Application Crashes After Deploy

**Solution:**
1. Check Railway logs for error messages
2. Verify all required environment variables are set
3. Check memory limits (Railway Hobby plan: 512MB)
4. Increase memory if needed in Railway settings
5. Check for out-of-memory errors in logs

---

## Important Notes

### Security

1. **Never commit secrets to git**
   - Use `.env` for local development (already in `.gitignore`)
   - Use Railway environment variables for production
   - Rotate secrets regularly

2. **JWT Secret**
   - Generate new secret for production
   - Minimum 256 bits (32 bytes base64)
   - Never use default/example values

3. **Database Passwords**
   - Use Railway's auto-generated passwords
   - Never use default passwords in production

### Performance

1. **Database Connection Pooling**
   - Spring Boot auto-configures Hikari CP
   - Default pool size: 10 connections
   - Adjust if needed in application.properties

2. **Memory Settings**
   - Backend: ~300-400MB needed
   - Frontend: ~100-200MB needed
   - Railway Hobby: 512MB limit per service

### Timezone Critical Points

1. **Always Set APP_TIMEZONE**
   - Backend: `APP_TIMEZONE=Asia/Colombo`
   - Frontend: `NEXT_PUBLIC_TIMEZONE=Asia/Colombo`
   - These must match!

2. **Server Location Doesn't Matter**
   - Railway can host in US, Europe, Asia - doesn't matter
   - Timezone configuration handles all date/time calculations
   - Business logic works correctly regardless of server location

3. **Affected Features**
   - ✅ Attendance (check-in/out times)
   - ✅ Tickets (scheduling, status updates)
   - ✅ Reports (monthly statistics)
   - ✅ Overtime calculations
   - ✅ Dashboard "Today" filtering

---

## Summary

✅ **Timezone Issue:** RESOLVED - Configurable via environment variable
✅ **Server Location:** Can be anywhere - timezone configuration handles it
✅ **Security:** Environment variables prevent secret exposure
✅ **Deployment:** Ready for Railway with this guide

**All systems will function correctly on Railway regardless of server location as long as `APP_TIMEZONE=Asia/Colombo` is set.**

---

For additional support:
- Railway Documentation: https://docs.railway.app
- Spring Boot Docs: https://docs.spring.io/spring-boot
- Next.js Deployment: https://nextjs.org/docs/deployment
