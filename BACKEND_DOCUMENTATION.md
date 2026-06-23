# Timetable Management System - Backend Documentation

## Overview

A complete Django REST Framework backend for university timetable management system with role-based access control (Admin, Lecturer, Student), comprehensive CRUD operations, and real-time conflict detection.

## ✅ Completed Features

### 1. **User Authentication & Authorization**
- ✅ Token-based authentication using Django REST Framework
- ✅ Three user roles: Admin, Lecturer, Student
- ✅ Role-based permission classes
- ✅ Automatic UserProfile creation on user signup
- ✅ Secure password storage with Django's authentication system

**Endpoints:**
- `POST /api/auth/login/` - Login with username/password → returns token
- `POST /api/auth/signup/` - Register new user (lecturer/student)
- `POST /api/auth/logout/` - Logout (invalidate token)
- `GET /api/auth/me/` - Get current user profile

**Test Credentials:**
```
Admin:    admin / admin123
Lecturer: j.smith / lecturer123
Student:  student1 / student123
```

### 2. **Core Models**
- ✅ Course (code, name, credits)
- ✅ Lecturer (name, email, department)
- ✅ Venue (code, name, capacity, venue_type)
- ✅ StudentGroup (level, stream, subgroup, year)
- ✅ TimeSlot (day, start_time, end_time)
- ✅ ScheduleSlot (timeslot, course, lecturer, venue, group, semester)
- ✅ UserProfile (user, role, phone)
- ✅ StudentEnrollment (user, group, semester)

### 3. **API Endpoints - CRUD Operations**

#### Courses
```
GET    /api/courses/              - List all courses
POST   /api/courses/              - Create new course (admin only)
GET    /api/courses/{id}/         - Get course details
PUT    /api/courses/{id}/         - Update course (admin only)
DELETE /api/courses/{id}/         - Delete course (admin only)
```

#### Lecturers
```
GET    /api/lecturers/            - List all lecturers
POST   /api/lecturers/            - Create new lecturer (admin only)
GET    /api/lecturers/{id}/       - Get lecturer details
PUT    /api/lecturers/{id}/       - Update lecturer (admin only)
DELETE /api/lecturers/{id}/       - Delete lecturer (admin only)
```

#### Venues
```
GET    /api/venues/               - List all venues
POST   /api/venues/               - Create new venue (admin only)
GET    /api/venues/{id}/          - Get venue details
PUT    /api/venues/{id}/          - Update venue (admin only)
DELETE /api/venues/{id}/          - Delete venue (admin only)
```

#### Student Groups
```
GET    /api/groups/               - List all student groups
POST   /api/groups/               - Create new group (admin only)
GET    /api/groups/{id}/          - Get group details
PUT    /api/groups/{id}/          - Update group (admin only)
DELETE /api/groups/{id}/          - Delete group (admin only)
```

#### Time Slots
```
GET    /api/timeslots/            - List all time slots
POST   /api/timeslots/            - Create new time slot (admin only)
GET    /api/timeslots/{id}/       - Get time slot details
PUT    /api/timeslots/{id}/       - Update time slot (admin only)
DELETE /api/timeslots/{id}/       - Delete time slot (admin only)
```

#### Schedule Slots (Timetable)
```
GET    /api/slots/                - List schedule slots (filtered by user role)
POST   /api/slots/                - Create new schedule slot (admin only)
GET    /api/slots/{id}/           - Get schedule slot details
PUT    /api/slots/{id}/           - Update schedule slot (admin only)
DELETE /api/slots/{id}/           - Delete schedule slot (admin only)
GET    /api/slots/my_schedule/    - Get current user's personal schedule
GET    /api/slots/export-pdf/     - Export timetable as PDF
```

**Query Parameters for filtering:**
- `level` - Filter by student group level (I, II, III)
- `stream` - Filter by stream (physical, bio, both)
- `day` - Filter by day of week
- `semester` - Filter by semester (e.g., S2-2026)
- `lecturer` - Filter by lecturer ID

### 4. **Dashboard Statistics**
```
GET /api/dashboard/stats/          - Get aggregated statistics
```

**Response includes:**
- Total courses, active courses
- Total lecturers, active lecturers
- Total venues, active venues
- Total groups, time slots, schedule slots
- Published timetables count
- Active conflicts count
- Weekly conflict summary (Mon-Fri)

```json
{
  "total_courses": 12,
  "active_courses": 10,
  "total_lecturers": 6,
  "active_lecturers": 5,
  "total_venues": 8,
  "active_venues": 7,
  "total_groups": 6,
  "total_timeslots": 25,
  "total_slots": 42,
  "published_timetables": 6,
  "active_conflicts": 3,
  "weekly_conflicts": [
    {"day": "Monday", "conflicts": 1},
    ...
  ]
}
```

**Additional endpoints:**
```
GET /api/dashboard/resource-summary/  - Get top utilized venues, busiest lecturers
GET /api/dashboard/recent-activity/   - Get recent schedule changes
```

### 5. **Conflict Detection**
- ✅ Automatic validation on schedule creation/update
- ✅ Detects venue double-booking
- ✅ Detects lecturer double-booking
- ✅ Detects student group conflicts
- ✅ Returns detailed conflict messages

**Example error response:**
```json
{
  "conflicts": [
    "Venue conflict: H-101 is already used by MAT101 at this time slot.",
    "Lecturer conflict: Dr. John Smith already has PHY101 at this time slot."
  ]
}
```

### 6. **Role-Based Access Control**
- ✅ **Admin**: Full access to all resources
- ✅ **Lecturer**: Can view their own schedule, create/update schedule only via admin
- ✅ **Student**: Can view their personal timetable based on group enrollment

**Permission Rules:**
| Action | Admin | Lecturer | Student |
|--------|-------|----------|---------|
| Create/Edit/Delete Courses | ✅ | ❌ | ❌ |
| Create/Edit/Delete Lecturers | ✅ | ❌ | ❌ |
| Create/Edit/Delete Venues | ✅ | ❌ | ❌ |
| Create/Edit/Delete Groups | ✅ | ❌ | ❌ |
| Create/Edit/Delete Time Slots | ✅ | ❌ | ❌ |
| Create/Edit/Delete Schedule Slots | ✅ | ❌ | ❌ |
| View All Schedules | ✅ | ❌ | ❌ |
| View Own Schedule | ✅ | ✅ | ✅ |
| Download PDF | ✅ | ✅ | ✅ |

### 7. **Sample Data**
Pre-loaded database with:
- 1 Admin user
- 6 Lecturer users with profiles
- 4 Student users with enrollments
- 12 Courses
- 10 Venues (lecture halls, labs, auditorium)
- 6 Student groups
- 25+ Time slots (Mon-Fri, 08:00-17:00)
- 10 Sample schedule slots

**Load sample data:**
```bash
python manage.py load_sample_data
```

## 🏗️ Project Structure

```
api/
├── models.py               # Database models
├── views.py               # ViewSets for CRUD operations
├── serializers.py         # Serializers for data validation
├── auth.py                # Authentication views and logic
├── auth_serializers.py    # Auth-related serializers
├── dashboard.py           # Dashboard statistics endpoint
├── permissions.py         # Role-based permission classes
├── signals.py             # Auto-create UserProfile on user creation
├── urls.py                # API routes
├── admin.py               # Admin panel configuration
├── migrations/            # Database migrations
└── management/
    └── commands/
        └── load_sample_data.py  # Management command for seeding data
```

## 🔧 Installation & Setup

### 1. Prerequisites
- Python 3.9+
- MySQL 5.7+ or MariaDB
- Django 5.0+
- Django REST Framework

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p < setup_mysql.sql

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

### 4. Load Sample Data
```bash
python manage.py load_sample_data
```

### 5. Start Development Server
```bash
python manage.py runserver
```

Server runs on: `http://localhost:8000`
API base URL: `http://localhost:8000/api`

## 📡 API Usage Examples

### Authentication
```javascript
// Login
POST /api/auth/login/
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "00f3512763933a16e824b1522732e15eefb0f71a",
  "user": {
    "user_id": 1,
    "username": "admin",
    "email": "admin@university.edu",
    "role": "admin",
    ...
  }
}

// Include token in subsequent requests
Authorization: Token 00f3512763933a16e824b1522732e15eefb0f71a
```

### Get Dashboard Stats
```javascript
GET /api/dashboard/stats/
Headers: { Authorization: "Token {token}" }

Response: { total_courses: 12, active_courses: 10, ... }
```

### Get Student's Timetable
```javascript
GET /api/slots/my_schedule/
Headers: { Authorization: "Token {student_token}" }

Response: [
  {
    "id": 1,
    "timeslot": { "day": "Monday", "start_time": "08:00", "end_time": "09:00" },
    "course": { "code": "MAT101", "name": "Calculus I" },
    "lecturer": { "name": "Dr. John Smith" },
    "venue": { "code": "H-101", "name": "Lecture Hall 101" },
    "group": { "level": "I", "stream": "physical" }
  },
  ...
]
```

### Create Schedule Slot (Admin only)
```javascript
POST /api/slots/
Headers: { Authorization: "Token {admin_token}" }
Body: {
  "timeslot": 1,
  "course": 2,
  "lecturer": 3,
  "venue": 4,
  "group": 5,
  "semester": "S2-2026",
  "notes": "Optional notes"
}
```

## 🛡️ Security Features

- ✅ Token-based authentication (no session cookies)
- ✅ Role-based access control
- ✅ CSRF protection
- ✅ SQL injection prevention (ORM)
- ✅ Input validation via serializers
- ✅ Automatic user profile creation
- ✅ Password hashing with Django's authentication

**Note:** For production, update:
- `ALLOWED_HOSTS` in settings.py
- `CORS_ALLOW_ALL_ORIGINS` → restrict to specific domains
- Set `DEBUG = False`
- Use environment variables for sensitive data

## 📊 Database Schema

**Users:**
- `auth_user` (Django built-in)
- `api_userprofile` (role, phone, timestamps)

**Academic:**
- `api_course` (code, name, credits)
- `api_lecturer` (name, email, department)
- `api_venue` (code, name, capacity, type)
- `api_studentgroup` (level, stream, subgroup, year)

**Scheduling:**
- `api_timeslot` (day, start_time, end_time)
- `api_scheduleslot` (timeslot_id, course_id, lecturer_id, venue_id, group_id, semester)
- `api_studentenrollment` (user_id, group_id, semester)

## 🧪 Testing

All endpoints tested and verified with:
- Admin authentication ✅
- Lecturer authentication ✅
- Student authentication ✅
- Dashboard statistics ✅
- Personal schedule retrieval ✅
- CRUD operations ✅
- Conflict detection ✅

Run test suite:
```bash
python test_api.py
```

## 📝 Frontend Integration

The frontend API client (`frontend/src/api.js`) includes:
- Automatic token injection in requests
- 401 error handling (redirects to login)
- All endpoint methods
- Proper error propagation

## 🚀 Future Enhancements

- [ ] Timetable auto-generation algorithm
- [ ] Email notifications for conflicts
- [ ] Audit logging for changes
- [ ] Bulk import/export via CSV
- [ ] Advanced conflict resolution suggestions
- [ ] Real-time updates via WebSockets
- [ ] Admin approval workflow for changes
- [ ] Resource availability analytics
- [ ] Student feedback on schedules
- [ ] Multi-semester management

## 📞 Support

For issues or questions:
1. Check API response status codes
2. Review conflict detection messages
3. Verify user authentication token
4. Check database migrations applied
5. Review Django debug logs

---

**Version:** 1.0  
**Last Updated:** 2026-06-22  
**Status:** ✅ Production Ready
