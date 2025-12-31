# API REFERENCE GUIDE

## Base URL
```
http://localhost:8080/api
```

## Authentication Header
```
Authorization: Bearer {accessToken}
```

---

## Authentication APIs

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response 200:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "username": "admin",
  "fullName": "System Administrator",
  "role": "ADMIN",
  "email": "admin@ems.com"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "username": "admin",
  "fullName": "System Administrator",
  "role": "ADMIN",
  "email": "admin@ems.com"
}
```

---

## Admin APIs

### Create User
```http
POST /admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "fullName": "John Doe",
  "role": "EMPLOYEE",
  "phone": "+94771234567",
  "email": "john@example.com",
  "active": true
}

Response 200:
{
  "id": 3,
  "username": "john_doe",
  "fullName": "John Doe",
  "role": "EMPLOYEE",
  "phone": "+94771234567",
  "email": "john@example.com",
  "active": true,
  "createdAt": "2024-01-15T10:30:00"
}
```

### Get All Users (Paginated)
```http
GET /admin/users?page=0&size=10&sortBy=id
Authorization: Bearer {token}

Response 200:
{
  "content": [...],
  "pageable": {...},
  "totalElements": 5,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

### Create Generator
```http
POST /admin/generators
Authorization: Bearer {token}
Content-Type: application/json

{
  "model": "CAT-5000",
  "name": "Gen-001",
  "capacity": "5000 KVA",
  "locationName": "Colombo Port",
  "ownerEmail": "port@example.com",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "note": "Main port generator"
}

Response 200:
{
  "id": 1,
  "model": "CAT-5000",
  "name": "Gen-001",
  ...
}
```

### Create Main Ticket
```http
POST /admin/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "generatorId": 1,
  "title": "Routine Maintenance",
  "description": "Monthly maintenance check",
  "type": "MAINTENANCE",
  "weight": 3,
  "scheduledDate": "2024-01-20",
  "scheduledTime": "09:00:00",
  "employeeIds": [2, 3]
}

Response 200:
{
  "id": 1,
  "ticketNumber": "TKT-AB12CD34",
  "generator": {...},
  "title": "Routine Maintenance",
  "status": "PENDING",
  ...
}
```

---

## Employee APIs

### Start Day
```http
POST /employee/day/start
Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "employee": {...},
  "date": "2024-01-15",
  "dayStartTime": "2024-01-15T08:00:00",
  "morningOtMinutes": 30
}
```

### End Day
```http
POST /employee/day/end
Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "employee": {...},
  "date": "2024-01-15",
  "dayStartTime": "2024-01-15T08:00:00",
  "dayEndTime": "2024-01-15T18:00:00",
  "morningOtMinutes": 30,
  "eveningOtMinutes": 30
}
```

### Get My Job Cards
```http
GET /employee/job-cards?page=0&size=10
Authorization: Bearer {token}

Response 200:
{
  "content": [
    {
      "id": 1,
      "mainTicket": {...},
      "employee": {...},
      "status": "PENDING",
      "startTime": null,
      "endTime": null,
      "approved": false,
      "workMinutes": 0
    }
  ],
  "totalElements": 5,
  "totalPages": 1
}
```

### Update Job Status
```http
PUT /employee/job-cards/1/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "newStatus": "TRAVELING",
  "latitude": 6.9271,
  "longitude": 79.8612
}

Response 200:
{
  "id": 1,
  "status": "TRAVELING",
  ...
}
```

---

## Status Codes

- **200 OK**: Success
- **400 Bad Request**: Invalid input or business rule violation
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Error Response Format
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid status transition from PENDING to COMPLETED",
  "path": "/api/employee/job-cards/1/status"
}
```

---

## Pagination Parameters

All list endpoints support pagination:

- `page`: Page number (0-indexed), default: 0
- `size`: Page size, default: 10
- `sortBy`: Field to sort by (optional)

Example:
```
GET /admin/users?page=0&size=20&sortBy=createdAt
```

---

## Job Status Flow

```
PENDING → TRAVELING → STARTED → COMPLETED
    ↓         ↓          ↓
  CANCEL   ON_HOLD   ON_HOLD
               ↓
            STARTED
```

Valid transitions must be followed or API will return 400 Bad Request.
