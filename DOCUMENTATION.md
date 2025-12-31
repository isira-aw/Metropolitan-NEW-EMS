# EMPLOYEE MANAGEMENT SYSTEM - TECHNICAL DOCUMENTATION

## TABLE OF CONTENTS
1. System Overview
2. Architecture
3. Database Schema
4. API Endpoints
5. Business Logic
6. Setup Instructions

---

## 1. SYSTEM OVERVIEW

### Domain
Field Service / Workforce Management for Generator Service & Maintenance

### System Type
Internal Enterprise Management System

### Architecture
Layered Monolith with REST API

### Tech Stack
**Backend:**
- Spring Boot 3.2.0
- Spring Security + JWT
- PostgreSQL
- JPA/Hibernate
- Lombok

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios

---

## 2. ARCHITECTURE

### Backend Package Structure
```
com.ems
├── config/              # Security & application configuration
├── controller/          # REST API endpoints
├── dto/                 # Data Transfer Objects
├── entity/              # JPA entities
├── repository/          # Data access layer
├── security/            # JWT utilities & filters
└── service/             # Business logic
```

### Frontend Structure
```
src/
├── app/
│   ├── admin/          # Admin pages
│   ├── employee/       # Employee pages
│   ├── login/          # Login page
│   └── globals.css     # Global styles
└── lib/
    └── api.ts          # API client with interceptors
```

---

## 3. DATABASE SCHEMA

### Core Tables

#### users
- id (PK)
- username (UNIQUE)
- password (encrypted)
- full_name
- role (ADMIN | EMPLOYEE)
- phone
- email (UNIQUE)
- active (boolean)
- created_at

#### generators
- id (PK)
- model
- name
- capacity
- location_name
- owner_email
- latitude
- longitude
- note
- created_at

#### main_tickets
- id (PK)
- ticket_number (UNIQUE)
- generator_id (FK)
- title
- description
- type (SERVICE | REPAIR | MAINTENANCE | VISIT | EMERGENCY)
- weight (1-5)
- status (PENDING | TRAVELING | STARTED | ON_HOLD | COMPLETED | CANCEL)
- scheduled_date
- scheduled_time
- created_by
- created_at

#### ticket_assignments
- id (PK)
- main_ticket_id (FK)
- employee_id (FK)
- assigned_at

#### mini_job_cards
- id (PK)
- main_ticket_id (FK)
- employee_id (FK)
- status
- start_time
- end_time
- approved (boolean)
- work_minutes
- image_url
- created_at

#### job_status_logs
- id (PK)
- mini_job_card_id (FK)
- employee_email
- prev_status
- new_status
- latitude
- longitude
- logged_at

#### employee_day_attendance
- id (PK)
- employee_id (FK)
- date
- day_start_time
- day_end_time
- total_work_minutes
- morning_ot_minutes
- evening_ot_minutes
- unique_key (UNIQUE)

#### employee_scores
- id (PK)
- employee_id (FK)
- main_ticket_id (FK)
- weight
- score
- approved_by
- approved_at

---

## 4. API ENDPOINTS

### Authentication (Public)
```
POST /api/auth/login
  Body: { username, password }
  Response: { accessToken, refreshToken, username, fullName, role, email }

POST /api/auth/refresh
  Body: { refreshToken }
  Response: { accessToken, refreshToken, username, fullName, role, email }
```

### Admin Endpoints (ROLE_ADMIN)

#### User Management
```
POST   /api/admin/users
GET    /api/admin/users?page=0&size=10&sortBy=id
GET    /api/admin/employees?page=0&size=10
GET    /api/admin/users/{id}
PUT    /api/admin/users/{id}
DELETE /api/admin/users/{id}
```

#### Generator Management
```
POST   /api/admin/generators
GET    /api/admin/generators?page=0&size=10
GET    /api/admin/generators/{id}
PUT    /api/admin/generators/{id}
DELETE /api/admin/generators/{id}
```

#### Ticket Management
```
POST   /api/admin/tickets
  Body: {
    generatorId,
    title,
    description,
    type,
    weight (1-5),
    scheduledDate,
    scheduledTime,
    employeeIds: [id1, id2, ...]
  }

GET    /api/admin/tickets?page=0&size=10
GET    /api/admin/tickets/{id}
GET    /api/admin/tickets/{id}/mini-jobs
```

### Employee Endpoints (ROLE_EMPLOYEE)

#### Day Management
```
POST   /api/employee/day/start
POST   /api/employee/day/end
GET    /api/employee/day/status
```

#### Job Card Management
```
GET    /api/employee/job-cards?page=0&size=10
GET    /api/employee/job-cards/{id}
PUT    /api/employee/job-cards/{id}/status
  Body: { newStatus, latitude, longitude }
```

---

## 5. BUSINESS LOGIC

### Main Workflow

1. **ADMIN Creates Main Ticket**
   - Selects generator
   - Assigns 1-5 employees
   - Sets weight (1-5 stars)
   - Schedules date & time

2. **System Creates:**
   - One MainTicket record
   - One TicketAssignment per employee
   - One MiniJobCard per employee

3. **EMPLOYEE Workflow:**
   - Starts day (tracks morning OT if before 8:30 AM)
   - Views assigned MiniJobCards
   - Updates status with GPS location
   - Ends day (tracks evening OT if after 5:30 PM)

### Job Status Transitions

```
PENDING → TRAVELING → STARTED → COMPLETED
    ↓         ↓          ↓
  CANCEL   ON_HOLD   ON_HOLD
               ↓
            STARTED
```

**Rules:**
- PENDING → TRAVELING or CANCEL
- TRAVELING → STARTED, ON_HOLD, or CANCEL
- STARTED → ON_HOLD, COMPLETED, or CANCEL
- ON_HOLD → STARTED or CANCEL
- COMPLETED/CANCEL → Final (no transitions)

### OT Calculation

**Morning OT:**
- If day starts before 8:30 AM
- Minutes = (8:30 - start_time)

**Evening OT:**
- If day ends after 5:30 PM
- Minutes = (end_time - 5:30 PM)

### Status Update Restrictions
- Can only update status if day has started
- Must log GPS coordinates with each update
- Every change is recorded in job_status_logs

---

## 6. SETUP INSTRUCTIONS

### Prerequisites
- Java 17+
- PostgreSQL 12+
- Node.js 18+
- Maven 3.8+

### Backend Setup

1. **Create PostgreSQL Database:**
```sql
CREATE DATABASE ems_db;
```

2. **Update application.properties:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ems_db
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

3. **Run Backend:**
```bash
cd backEND
./mvnw clean install
./mvnw spring-boot:run
```

Backend will run on: http://localhost:8080

### Frontend Setup

1. **Install Dependencies:**
```bash
cd frontEND
npm install
```

2. **Run Development Server:**
```bash
npm run dev
```

Frontend will run on: http://localhost:3000

### Default Credentials

**Admin:**
- Username: admin
- Password: admin123

**Employee:**
- Username: employee
- Password: emp123

---

## 7. KEY FEATURES

✅ JWT Authentication (Access + Refresh tokens)
✅ Role-based access control (ADMIN, EMPLOYEE)
✅ Main Ticket → Mini Job Card workflow
✅ GPS-based status tracking
✅ Day Start/End tracking
✅ Automatic OT calculation
✅ Status transition validation
✅ Complete audit trail (job_status_logs)
✅ Pagination on all list endpoints
✅ Simple, maintainable code structure

---

## 8. SECURITY

### JWT Implementation
- Access Token: 1 hour expiration
- Refresh Token: 24 hours expiration
- Tokens stored in localStorage
- Auto-refresh on 401 errors

### Password Encryption
- BCrypt with default strength (10)

### CORS Configuration
- Allowed Origin: http://localhost:3000
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS

---

## 9. FUTURE ENHANCEMENTS

1. Report generation (time tracking, OT reports)
2. Employee scoring system
3. File upload for job evidence
4. Push notifications
5. Mobile app
6. Advanced filtering & search
7. Export to PDF/Excel

---

## 10. TROUBLESHOOTING

**Issue: Cannot connect to database**
Solution: Verify PostgreSQL is running and credentials are correct

**Issue: CORS errors**
Solution: Ensure frontend URL matches CORS configuration

**Issue: Token expired**
Solution: Tokens auto-refresh; clear localStorage and re-login if needed

**Issue: Can't update job status**
Solution: Ensure day has been started first

---

END OF DOCUMENTATION
