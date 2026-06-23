#!/usr/bin/env python
import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_api():
    print("="*70)
    print("TIMETABLE API TEST SUITE")
    print("="*70)
    
    # Test 1: Admin Login
    print("\nTest 1: Admin Login")
    print("-" * 70)
    response = requests.post(f'{BASE_URL}/auth/login/', json={
        'username': 'admin',
        'password': 'admin123'
    })
    print(f'Status: {response.status_code}')
    admin_data = response.json()
    print(json.dumps(admin_data, indent=2))
    admin_token = admin_data.get('token')
    
    # Test 2: Lecturer Login
    print("\nTest 2: Lecturer Login")
    print("-" * 70)
    response = requests.post(f'{BASE_URL}/auth/login/', json={
        'username': 'j.smith',
        'password': 'lecturer123'
    })
    print(f'Status: {response.status_code}')
    lecturer_data = response.json()
    print(json.dumps(lecturer_data, indent=2))
    lecturer_token = lecturer_data.get('token')
    
    # Test 3: Student Login
    print("\nTest 3: Student Login")
    print("-" * 70)
    response = requests.post(f'{BASE_URL}/auth/login/', json={
        'username': 'student1',
        'password': 'student123'
    })
    print(f'Status: {response.status_code}')
    student_data = response.json()
    print(json.dumps(student_data, indent=2))
    student_token = student_data.get('token')
    
    # Test 4: Dashboard Stats (Admin Only)
    print("\nTest 4: Get Dashboard Stats (Admin Only)")
    print("-" * 70)
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f'{BASE_URL}/dashboard/stats/', headers=headers)
    print(f'Status: {response.status_code}')
    stats = response.json()
    print(f"Total Courses: {stats.get('total_courses')}")
    print(f"Total Lecturers: {stats.get('total_lecturers')}")
    print(f"Total Venues: {stats.get('total_venues')}")
    print(f"Published Timetables: {stats.get('published_timetables')}")
    print(f"Active Conflicts: {stats.get('active_conflicts')}")
    print(f"Weekly Conflicts: {json.dumps(stats.get('weekly_conflicts'), indent=2)}")
    
    # Test 5: Get Courses
    print("\nTest 5: Get Courses (Admin)")
    print("-" * 70)
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f'{BASE_URL}/courses/', headers=headers)
    print(f'Status: {response.status_code}')
    courses = response.json()
    num_courses = len(courses.get('results', courses)) if isinstance(courses, dict) and 'results' in courses else len(courses)
    print(f'Total Courses: {num_courses}')
    if isinstance(courses, dict) and 'results' in courses and courses['results']:
        print(f'First Course: {courses["results"][0]}')
    elif isinstance(courses, list) and courses:
        print(f'First Course: {courses[0]}')
    
    # Test 6: Get Student's Schedule (Student)
    print("\nTest 6: Get Student's Personal Schedule")
    print("-" * 70)
    headers = {'Authorization': f'Token {student_token}'}
    response = requests.get(f'{BASE_URL}/slots/my_schedule/', headers=headers)
    print(f'Status: {response.status_code}')
    slots = response.json()
    print(f'Student Schedule Slots: {len(slots)}')
    if slots:
        print(f'First Slot: {slots[0]}')
    
    # Test 7: Get Lecturer's Schedule (Lecturer)
    print("\nTest 7: Get Lecturer's Personal Schedule")
    print("-" * 70)
    headers = {'Authorization': f'Token {lecturer_token}'}
    response = requests.get(f'{BASE_URL}/slots/my_schedule/', headers=headers)
    print(f'Status: {response.status_code}')
    slots = response.json()
    print(f'Lecturer Schedule Slots: {len(slots)}')
    if slots:
        print(f'First Slot: {json.dumps(slots[0], indent=2)}')
    
    # Test 8: Get Groups
    print("\nTest 8: Get Student Groups")
    print("-" * 70)
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f'{BASE_URL}/groups/', headers=headers)
    print(f'Status: {response.status_code}')
    groups = response.json()
    num_groups = len(groups.get('results', groups)) if isinstance(groups, dict) and 'results' in groups else len(groups)
    print(f'Total Groups: {num_groups}')
    
    # Test 9: Get Lecturers
    print("\nTest 9: Get Lecturers")
    print("-" * 70)
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f'{BASE_URL}/lecturers/', headers=headers)
    print(f'Status: {response.status_code}')
    lecturers = response.json()
    num_lecturers = len(lecturers.get('results', lecturers)) if isinstance(lecturers, dict) and 'results' in lecturers else len(lecturers)
    print(f'Total Lecturers: {num_lecturers}')
    
    # Test 10: Get User Profile
    print("\nTest 10: Get Current User Profile")
    print("-" * 70)
    headers = {'Authorization': f'Token {admin_token}'}
    response = requests.get(f'{BASE_URL}/auth/me/', headers=headers)
    print(f'Status: {response.status_code}')
    profile = response.json()
    print(json.dumps(profile, indent=2))
    
    print("\n" + "="*70)
    print("ALL TESTS COMPLETED!")
    print("="*70)

if __name__ == '__main__':
    test_api()
