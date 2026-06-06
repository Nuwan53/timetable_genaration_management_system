# Timetable Management System
**Stack:** React + Django REST Framework + MySQL

---

## Setup (Step by Step)

### 1. MySQL Database
Open MySQL Workbench and run:
```sql
CREATE DATABASE timetable_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend (Django)
```bash
cd timetable/

# Install Python dependencies
pip install -r requirements.txt

# Edit core/settings.py — update your MySQL password:
# 'USER': 'root', 'PASSWORD': 'your_actual_password'

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Start backend
python manage.py runserver
# → Runs at http://localhost:8000
```

### 3. Frontend (React)
```bash
cd frontend/
npm install
npm run dev
# → Runs at http://localhost:5173
```

---

## Using the System

1. Open http://localhost:5173
2. Go to **Time Slots** → add all your weekly slots (e.g. Monday 08:00–08:55)
3. Add **Courses**, **Lecturers**, **Venues**, **Student Groups**
4. Go to **Timetable** → select level + stream → click any empty cell to assign a slot
5. If there's a conflict (same venue/lecturer/group at same time), you'll see an error message
6. Click **Export PDF** to download the printable timetable

---

## API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | /api/courses/ | List or create courses |
| GET/POST | /api/lecturers/ | List or create lecturers |
| GET/POST | /api/venues/ | List or create venues |
| GET/POST | /api/groups/ | List or create student groups |
| GET/POST | /api/timeslots/ | List or create time slots |
| GET/POST | /api/slots/ | List or create schedule slots |
| GET | /api/slots/?level=I&stream=physical | Filter timetable |
| GET | /api/slots/export-pdf/?level=I&stream=physical&semester=S2-2026 | Download PDF |

---

## Conflict Detection
The system automatically blocks any slot that causes:
- **Venue conflict** — same room booked at the same time
- **Lecturer conflict** — same lecturer scheduled at the same time  
- **Student group conflict** — same group has two classes at the same time

Errors are shown directly in the form with a clear message.
