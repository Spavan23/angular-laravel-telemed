export interface User {
    id: string;
    name: string;
    email: string;
    role: 'patient' | 'doctor';
    phone: string;
    specialty?: string; // For doctors
    createdAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
    phone: string;
    specialty?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}
