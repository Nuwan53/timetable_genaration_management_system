#!/usr/bin/env python
import requests
import json

BASE_URL = 'http://localhost:8000/api'

# Admin Login
response = requests.post(f'{BASE_URL}/auth/login/', json={
    'username': 'admin',
    'password': 'admin123'
})
admin_token = response.json().get('token')

# Test Dashboard Stats
print("Test: Get Dashboard Stats")
print("-" * 70)
headers = {'Authorization': f'Token {admin_token}'}
response = requests.get(f'{BASE_URL}/dashboard/stats/', headers=headers)
print(f'Status: {response.status_code}')
print(f'Response Text: {response.text}')
