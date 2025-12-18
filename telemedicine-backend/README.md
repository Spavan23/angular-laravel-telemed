# Telemedicine Backend

Laravel REST API for telemedicine booking system with Firebase Realtime Database integration.

## Prerequisites

- PHP 8.2+
- Composer
- Firebase project with Realtime Database

## Installation

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret

# Configure Firebase credentials in .env
```

## Configuration

Add to `.env`:
```
FIREBASE_CREDENTIALS=storage/app/firebase-credentials.json
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
JWT_SECRET=your-generated-secret
```

## Running

```bash
php artisan serve
```

API will be available at `http://localhost:8000/api`

## API Endpoints

### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login user
- POST `/api/logout` - Logout user
- GET `/api/me` - Get current user

### Patient Endpoints
- POST `/api/consultations` - Book consultation
- GET `/api/consultations` - Get patient's consultations
- GET `/api/consultations/{id}` - Get consultation details

### Doctor Endpoints
- GET `/api/doctor/consultations` - Get assigned consultations
- PUT `/api/consultations/{id}/status` - Update consultation status
- GET `/api/doctor/availability` - Get availability
- POST `/api/doctor/availability` - Set availability
