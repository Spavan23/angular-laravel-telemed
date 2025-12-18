# Telemedicine Application

A full-stack telemedicine platform enabling patients to book consultations with doctors, featuring real-time updates and secure authentication.

> [!WARNING]
> **Note:** This backend is designed as a **Mini Project** for demonstration purposes only. It is not intended for production usage and may not function fully without further configuration or development.

## 🚀 Tech Stack

- **Frontend:** Angular
- **Backend:** Laravel (PHP)
- **Database:** Firebase Realtime Database
- **Authentication:** JWT (JSON Web Tokens)

## 📂 Project Structure

- `telemedicine-frontend/`: Angular client application
- `telemedicine-backend/`: Laravel REST API server

## 🛠️ Prerequisites

- Node.js & npm (for Angular)
- PHP 8.2+ & Composer (for Laravel)
- Firebase Project (with Realtime Database enabled)

## ⚡ Installation & Setup

### 1. Backend Setup (Laravel)

```bash
cd telemedicine-backend

# Install PHP dependencies
composer install

# Copy environment configuration
cp .env.example .env

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret
```

**Configuration:**
Update `.env` with your Firebase credentials and database URL:
```env
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FIREBASE_CREDENTIALS=path/to/firebase-adminsdk.json
```

**Run Server:**
```bash
php artisan serve
```
The API will run at `http://localhost:8000`.

### 2. Frontend Setup (Angular)

```bash
cd telemedicine-frontend

# Install Node dependencies
npm install

# Run Development Server
ng serve
```
Navigate to `http://localhost:4200` to view the application.

## 🔑 Key Features

- **User Authentication:** Registration and Login for Patients and Doctors.
- **Appointment Booking:** Patients can request consultations.
- **Doctor Dashboard:** Doctors can view and manage appointments.
- **Real-time Updates:** Status changes reflect instantly via Firebase.
 
