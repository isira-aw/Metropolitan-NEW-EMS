# Employee Management System (EMS) - COMPLETE VERSION

## 🎯 Overview
A **production-ready** Employee Management System for Generator Service & Maintenance division with **ALL features implemented**.

## ✅ IMPLEMENTED FEATURES

### 👥 Role-Based Access Control
- **ADMIN**: Full system access
  - Create ADMIN & EMPLOYEE users
  - Manage generators
  - Create and assign tickets
  - Approve work
  - Assign scores
  - Generate reports
  
- **EMPLOYEE**: Restricted access
  - View ONLY assigned work
  - Cannot see other employees' data
  - Update job status with GPS location
  - Day start/end tracking

### 🔧 Core Business Types
- **Job Types**: SERVICE, REPAIR, MAINTENANCE, VISIT, EMERGENCY
- **Job Status**: PENDING → TRAVELING → STARTED → ON_HOLD → COMPLETED / CANCEL
- **Weight System**: 1-5 stars (★ to ★★★★★)

### 🎯 Complete Workflow
1. **ADMIN creates Main Ticket**
   - Select generator
   - Assign 1-5 employees
   - Set weight (1-5 stars)
   - Schedule date & time

2. **System automatically creates**:
   - One MainTicket
   - One MiniJobCard per assigned employee
   - Initial status: PENDING

3. **EMPLOYEE workflow**:
   - Start Day (tracks morning OT if before 8:30 AM)
   - View assigned MiniJobCards
   - Update status with GPS location
   - Status changes are logged with timestamps
   - End Day (tracks evening OT if after 5:30 PM)

4. **ADMIN reviews work**:
   - Approve completed MiniJobCards
   - Assign scores (1-10) per employee
   - View status history logs

### 🔄 Job Status Transitions
```
PENDING → TRAVELING → STARTED → COMPLETED
    ↓         ↓          ↓
  CANCEL   ON_HOLD   ON_HOLD
               ↓
            STARTED
```

**Rules Enforced**:
- Every status change logs: previous status, new status, timestamp, GPS coordinates, employee
- Status updates only allowed between day start & day end
- Invalid transitions are blocked

### 🕘 Day Start/End & OT Logic

**Employee Actions**:
- Start Day button
- End Day button

**OT Calculation**:
- **Morning OT**: Time before 8:30 AM
- **Evening OT**: Time after 5:30 PM
- **No Evening OT** if day end is missing

**Time Tracking**:
- Work time (STARTED status)
- Idle time (ON_HOLD status)
- Travel time (TRAVELING status)
- Total daily work per employee

### 📊 Weight & Scoring
- Weight assigned to MainTicket (1-5 stars)
- After completion: ADMIN assigns score (1-10) per employee
- Score stored with ticket reference
- Used in performance reports

### 📑 Reports (ADMIN ONLY)

**1. Time Tracking Report**
- Filter by employee & date range
- Shows: Daily working time, idle time, travel time
- Detailed breakdown per day

**2. OT Report**
- Filter by employee & date range
- Shows: Morning OT, Evening OT, Total OT
- Per-day breakdown

**3. OT by Generator**
- Filter by date range
- Shows OT summary grouped by generator
- Useful for cost allocation

**4. Employee Score Report**
- View all scores for an employee
- Weighted average calculation
- Performance tracking

## 📦 Tech Stack

### Backend
- Spring Boot 3.2.0
- Spring Security + JWT (Access & Refresh tokens)
- PostgreSQL
- JPA/Hibernate
- Lombok
- Pageable pagination

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios with interceptors

## 🚀 Setup Instructions

### Prerequisites
- Java 17+
- PostgreSQL 12+
- Node.js 18+
- Maven 3.8+

### Step 1: Database Setup
```bash
# Create PostgreSQL database
createdb ems_db

# Or using psql:
psql -U postgres
CREATE DATABASE ems_db;
\q
```

### Step 2: Backend Configuration
```bash
cd backEND

# Edit src/main/resources/application.properties
# Update these lines:
spring.datasource.url=jdbc:postgresql://localhost:5432/ems_db
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

### Step 3: Run Backend
```bash
cd backEND

# Using Maven Wrapper (recommended)
./mvnw clean install
./mvnw spring-boot:run

# Or using installed Maven
mvn clean install
mvn spring-boot:run
```

Backend runs on: **http://localhost:8080**

### Step 4: Frontend Setup
```bash
cd frontEND

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

## 🔐 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Employee Account:**
- Username: `employee`
- Password: `emp123`

## 📱 Frontend Pages

### Admin Pages
- `/admin/dashboard` - Dashboard with statistics
- `/admin/users` - Create & manage users (ADMIN/EMPLOYEE)
- `/admin/generators` - Add & manage generators
- `/admin/tickets` - Create tickets, assign employees, approve work, assign scores
- `/admin/reports` - Generate all reports with filters

### Employee Pages
- `/employee/dashboard` - View day status & recent job cards
- `/employee/job-cards` - View all assigned jobs & update status

## 🎯 Key Features in Action

### Creating a Ticket (Admin)
1. Go to Tickets page
2. Click "Create Ticket"
3. Select generator
4. Enter title, description, type
5. Set weight (1-5 stars)
6. Choose scheduled date & time
7. Select 1-5 employees
8. Submit → System creates MainTicket + MiniJobCards

### Updating Job Status (Employee)
1. Go to Job Cards page
2. Click on a job card
3. Click on available status action
4. System captures GPS location
5. Status updated with timestamp & location logged

### Approving & Scoring (Admin)
1. View ticket details
2. See all mini job cards
3. Click "Approve" for completed jobs
4. Click "Assign Score" to rate performance (1-10)

### Generating Reports (Admin)
1. Go to Reports page
2. Select report type
3. Choose employee (optional) and date range
4. Click "Generate Report"
5. View detailed breakdown

## 📊 Database Tables

- `users` - Admin & Employee accounts
- `generators` - Generator information
- `main_tickets` - Ticket master records
- `ticket_assignments` - Employee assignments
- `mini_job_cards` - Individual employee tasks
- `job_status_logs` - Complete audit trail
- `employee_day_attendance` - Day start/end & OT tracking
- `employee_scores` - Performance scores

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Admin Endpoints
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users (paginated)
- `POST /api/admin/generators` - Create generator
- `GET /api/admin/generators` - List generators (paginated)
- `POST /api/admin/tickets` - Create main ticket
- `GET /api/admin/tickets` - List tickets (paginated)
- `GET /api/admin/tickets/{id}/mini-jobs` - Get mini job cards
- `PUT /api/admin/mini-jobs/{id}/approve` - Approve job
- `POST /api/admin/tickets/{id}/score` - Assign score
- `GET /api/admin/reports/time-tracking` - Time report
- `GET /api/admin/reports/ot` - OT report
- `GET /api/admin/reports/ot-by-generator` - OT by generator

### Employee Endpoints
- `POST /api/employee/day/start` - Start day
- `POST /api/employee/day/end` - End day
- `GET /api/employee/day/status` - Get day status
- `GET /api/employee/job-cards` - List my job cards
- `PUT /api/employee/job-cards/{id}/status` - Update status

## 🛡️ Security Features
- JWT authentication with access & refresh tokens
- Role-based authorization
- CORS protection
- BCrypt password encryption
- Secure endpoints with @PreAuthorize

## ⚙️ Business Rules Enforced
✅ Employees can only see their own job cards
✅ Status updates require day to be started
✅ Status transitions validated server-side
✅ GPS location required for all status updates
✅ OT calculated automatically
✅ Work time calculated from status logs
✅ Main ticket status syncs with mini job cards

## 📚 Documentation
- `DOCUMENTATION.md` - Technical documentation
- `API_REFERENCE.md` - Complete API guide
- `CORS_FIX.md` - CORS troubleshooting

## 🔍 Troubleshooting

**Backend not starting?**
- Check PostgreSQL is running
- Verify database credentials in application.properties
- Check port 8080 is not in use

**Frontend login fails?**
- Ensure backend is running
- Check browser console for errors
- Try clearing localStorage

**CORS errors?**
- Backend CORS is configured for all origins in development
- Clear browser cache

**Can't update job status?**
- Ensure day has been started
- Check location services are enabled
- Verify you're not trying to update after day end

## 🚀 Production Deployment

**Backend:**
1. Build: `./mvnw clean package`
2. Run: `java -jar target/employee-management-1.0.0.jar`

**Frontend:**
1. Build: `npm run build`
2. Start: `npm start`

**Important**: Update CORS, JWT secret, and database credentials for production!

## 📈 Performance
- Pagination on all list endpoints (configurable page size)
- Indexed database columns
- Lazy loading where applicable
- Optimized queries with JPA

## 🎨 UI/UX
- Clean, responsive design
- Color-coded job statuses
- Real-time feedback
- Mobile-friendly

## ✨ What Makes This Complete?
✅ All roles implemented
✅ Complete workflow (create → assign → execute → approve → score)
✅ Full status management with validation
✅ GPS location tracking
✅ Day start/end with OT calculation
✅ Time tracking (work/idle/travel)
✅ All 3 report types
✅ Approval workflow
✅ Scoring system
✅ Audit trail (job status logs)
✅ Role-based access control
✅ Pagination everywhere
✅ Error handling
✅ Clean architecture

## 📞 Support
Check documentation files for detailed information:
- Technical details → DOCUMENTATION.md
- API usage → API_REFERENCE.md
- CORS issues → CORS_FIX.md

---

**System Status**: ✅ Production Ready
**Code Quality**: Clean, maintainable, well-structured
**Documentation**: Complete
**Testing**: Ready for integration testing

**Built with ❤️ for real-world use**
