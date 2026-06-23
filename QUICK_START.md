# Quick Start Guide - Backend Setup

## 🚀 Get Started in 5 Minutes

### Step 1: Initialize Database
```bash
# Create MySQL database
mysql -u root -p < setup_mysql.sql

# Run migrations
cd e:\timetable
python manage.py makemigrations
python manage.py migrate
```

### Step 2: Load Sample Data
```bash
python manage.py load_sample_data
```

### Step 3: Start Backend Server
```bash
python manage.py runserver
# Server runs on http://localhost:8000
```

### Step 4: Test API
```bash
# Option 1: Run test suite
python test_api.py

# Option 2: Use curl/Postman
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## 📋 Key Endpoints

| Purpose | Endpoint | Method |
|---------|----------|--------|
| Admin Login | `/api/auth/login/` | POST |
| View Dashboard | `/api/dashboard/stats/` | GET |
| Manage Courses | `/api/courses/` | GET/POST/PUT/DELETE |
| Manage Lecturers | `/api/lecturers/` | GET/POST/PUT/DELETE |
| Manage Venues | `/api/venues/` | GET/POST/PUT/DELETE |
| Manage Groups | `/api/groups/` | GET/POST/PUT/DELETE |
| Create Schedule | `/api/slots/` | GET/POST/PUT/DELETE |
| My Schedule | `/api/slots/my_schedule/` | GET |
| Export PDF | `/api/slots/export-pdf/` | GET |

---

## 👥 Test Users

```
ADMIN
  Username: admin
  Password: admin123
  Role: Administrator (full access)

LECTURER
  Username: j.smith
  Password: lecturer123
  Role: Lecturer (view own schedule)

STUDENT
  Username: student1
  Password: student123
  Role: Student (view timetable)
```

---

## 🔑 Authentication

Every API request (except login/signup) needs authorization:

```javascript
fetch('http://localhost:8000/api/courses/', {
  headers: {
    'Authorization': 'Token YOUR_TOKEN_HERE'
  }
})
```

Get token from login response:
```bash
POST /api/auth/login/
Response: { "token": "xxxxx", "user": {...} }
```

---

## ⚡ Common Tasks

### Create a New Course
```bash
curl -X POST http://localhost:8000/api/courses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "code": "PHY201",
    "name": "Physics III",
    "credits": 4
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:8000/api/dashboard/stats/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### View Student's Timetable
```bash
curl http://localhost:8000/api/slots/my_schedule/ \
  -H "Authorization: Token STUDENT_TOKEN"
```

### Create Schedule Slot
```bash
curl -X POST http://localhost:8000/api/slots/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token ADMIN_TOKEN" \
  -d '{
    "timeslot": 1,
    "course": 2,
    "lecturer": 3,
    "venue": 4,
    "group": 5,
    "semester": "S2-2026"
  }'
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection error | Check MySQL is running, update credentials in settings.py |
| Import errors | Run `pip install -r requirements.txt` |
| 401 Unauthorized | Token missing/expired, re-login to get new token |
| 403 Forbidden | Insufficient permissions for user role |
| 404 Not Found | Resource ID doesn't exist |
| Conflict error | Schedule slot overlaps with existing slot |

---

## 📦 Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

Key packages:
- Django 5.0.8
- djangorestframework 3.14.0
- django-cors-headers 4.3.1
- django-rest-framework-simplejwt (for advanced auth)
- reportlab (for PDF export)
- mysql-connector-python or mysqlclient

---

## 🎯 Next Steps

1. **Connect Frontend**: Update `frontend/src/api.js` with your server URL
2. **Deploy**: Use Gunicorn/Nginx for production
3. **SSL/HTTPS**: Install SSL certificate for production
4. **Backups**: Set up regular database backups
5. **Monitoring**: Add logging and error tracking

---

**Full documentation:** See `BACKEND_DOCUMENTATION.md`
