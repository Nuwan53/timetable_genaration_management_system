"""
Test-only settings.
Inherits everything from the production settings, then overrides only
what is needed to run the test suite safely:
  - SQLite in-memory database (no MySQL dependency)
  - In-memory email backend (no real emails sent)
  - Console-safe DEFAULT_FROM_EMAIL (no .env dependency)

Usage:
    python manage.py test api --settings=core.test_settings --verbosity=2
"""

# Pull in ALL production settings so we test against real middleware,
# installed apps, REST_FRAMEWORK config, etc.
import os
os.environ.setdefault('EMAIL_HOST_USER', 'test@example.com')
os.environ.setdefault('EMAIL_HOST_PASSWORD', 'not-a-real-password')

from .settings import *  # noqa: F401, F403

# ── Safe test database ──────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# ── In-memory email backend ─────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
DEFAULT_FROM_EMAIL = 'Timetable Manager <test@example.com>'

# ── Speed up password hashing in tests ──────────────────────────────────────
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# ── Disable throttling if any ───────────────────────────────────────────────
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
}
REST_FRAMEWORK.pop('DEFAULT_THROTTLE_CLASSES', None)
REST_FRAMEWORK.pop('DEFAULT_THROTTLE_RATES', None)
