import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private db: any;

    constructor(private http: HttpClient) {

        const app = initializeApp(environment.firebase);
        this.db = getDatabase(app);
        this.loadUserFromStorage();
    }

    /**
     * Load user from localStorage on init
     */
    private loadUserFromStorage(): void {
        const token = this.getToken();
        const userStr = localStorage.getItem('currentUser');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
            } catch (e) {
                this.logout();
            }
        }
    }

    /**
     * Register a new user
     */
    register(data: RegisterRequest): Observable<AuthResponse> {

        return this.registerStandalone(data);
    }

    /**
     * Registration
     */

    private registerStandalone(data: RegisterRequest): Observable<AuthResponse> {
        const userId = btoa(data.email).replace(/=/g, '');
        const newUser: User = {
            id: userId,
            name: data.name,
            email: data.email,
            role: data.role,
            phone: data.phone,
            specialty: data.specialty,
            createdAt: new Date().toISOString()
        };

        const response: AuthResponse = {
            token: 'standalone-token-' + userId,
            user: newUser,
            message: 'Registration successful'
        };

        return new Observable<AuthResponse>(observer => {

            const userRef = ref(this.db, 'users/' + userId);
            set(userRef, newUser)
                .then(() => {
                    this.setSession(response);
                    observer.next(response);
                    observer.complete();
                })
                .catch(firebaseError => {



                    try {
                        const users = JSON.parse(localStorage.getItem('telemedicine_users') || '{}');
                        users[userId] = newUser;
                        localStorage.setItem('telemedicine_users', JSON.stringify(users));

                        this.setSession(response);
                        observer.next(response);
                        observer.complete();
                    } catch (storageError) {
                        observer.error({ message: 'Registration failed completely.' });
                    }
                });
        });
    }

    /**
     * Login
     */
    login(credentials: LoginRequest): Observable<AuthResponse> {

        return this.loginStandalone(credentials);
    }

    private loginStandalone(credentials: LoginRequest): Observable<AuthResponse> {
        const userId = btoa(credentials.email).replace(/=/g, '');

        return new Observable<AuthResponse>(observer => {
            const dbRef = ref(this.db);


            get(child(dbRef, `users/${userId}`))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        this.finishLogin(snapshot.val(), userId, observer);
                    } else {
                        this.checkLocalStorageLogin(userId, observer);
                    }
                })
                .catch(() => {

                    this.checkLocalStorageLogin(userId, observer);
                });
        });
    }

    private checkLocalStorageLogin(userId: string, observer: any): void {
        const users = JSON.parse(localStorage.getItem('telemedicine_users') || '{}');
        const user = users[userId];

        if (user) {
            this.finishLogin(user, userId, observer);
        } else {
            observer.error({ error: { error: 'User not found' }, message: 'User not found' });
        }
    }

    private finishLogin(user: User, userId: string, observer: any): void {
        const response: AuthResponse = {
            token: 'standalone-token-' + userId,
            user: user,
            message: 'Login successful'
        };
        this.setSession(response);
        observer.next(response);
        observer.complete();
    }

    /**
     * Logout user
     */
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Get auth token
     */
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Check if user has a specific role
     */
    hasRole(role: 'patient' | 'doctor'): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    /**
     * Set session data
     */
    private setSession(authResponse: AuthResponse): void {
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
        this.currentUserSubject.next(authResponse.user);
    }
}
