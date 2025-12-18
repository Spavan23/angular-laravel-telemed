import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Consultation, BookingRequest, BookingResponse, ConsultationStatus } from '../models/consultation.model';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private firebaseService: FirebaseService,
        private authService: AuthService
    ) { }

    /**
     * Book a new consultation
     */
    /**
     * Book a new consultation
     */
    bookConsultation(booking: BookingRequest): Observable<BookingResponse> {

        return this.bookStandalone(booking);
    }

    /**
     * Booking using direct Firebase
     */
    private bookStandalone(booking: BookingRequest): Observable<BookingResponse> {
        const user = this.authService.getCurrentUser();
        if (!user || !user.id) {
            return throwError(() => new Error('User not authenticated'));
        }

        const consultationId = 'cons-' + Math.random().toString(36).substr(2, 9);

        const consultation: Consultation = {
            id: consultationId,
            patientId: user.id,
            patientName: user.name,
            doctorId: 'doc-ram-kumar',
            doctorName: 'Dr. Ram Kumar',
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            status: 'Booked',
            reason: booking.reason || 'Not specified',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response: BookingResponse = {
            message: 'Consultation booked successfully',
            consultation: consultation,
            consultationId: consultationId
        };

        return new Observable<BookingResponse>(observer => {

            this.firebaseService.write(`consultations/${consultationId}`, consultation)
                .then(() => {
                    this.updateLocalStorage(consultation);
                    observer.next(response);
                    observer.complete();
                })
                .catch(firebaseError => {



                    try {
                        this.updateLocalStorage(consultation);
                        observer.next({
                            ...response,
                            message: 'Consultation booked successfully (Saved Locally)'
                        });
                        observer.complete();
                    } catch (storageError) {
                        observer.error({ message: 'Booking failed entirely.' });
                    }
                });
        });
    }

    private updateLocalStorage(newConsultation: Consultation): void {
        const consultations = JSON.parse(localStorage.getItem('telemedicine_consultations') || '[]');
        consultations.push(newConsultation);
        localStorage.setItem('telemedicine_consultations', JSON.stringify(consultations));
    }

    /**
     * Get all consultations for current user
     */
    getConsultations(): Observable<{ consultations: Consultation[] }> {
        // API first
        return this.http.get<{ consultations: Consultation[] }>(`${this.apiUrl}/consultations`).pipe(
            catchError(() => {
                return of({ consultations: [] });
            })
        );
    }

    /**
     * Update consultation status (doctor only)
     */
    updateStatus(id: string, status: ConsultationStatus): Observable<{ message: string }> {
        // API first
        return this.http.put<{ message: string }>(`${this.apiUrl}/consultations/${id}/status`, { status }).pipe(
            catchError((error: any) => {

                return new Observable<{ message: string }>(observer => {
                    this.firebaseService.update(`consultations/${id}`, { status, updatedAt: new Date().toISOString() })
                        .then(() => {
                            observer.next({ message: 'Status updated successfully (Standalone Mode)' });
                            observer.complete();
                        })
                        .catch(err => observer.error(err));
                });
            })
        );
    }

    /**
     * Listen to real-time consultation updates
     */
    listenToConsultation(consultationId: string): Observable<Consultation | null> {
        return this.firebaseService.listen<Consultation>(`consultations/${consultationId}`);
    }

    /**
     * Listen to all consultations (real-time)
     */
    listenToConsultations(): Observable<Consultation[]> {
        return this.firebaseService.listenToList<Consultation>('consultations');
    }

    /**
     * Listen to patient's consultations (real-time)
     */
    listenToPatientConsultations(): Observable<Consultation[]> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }


        return this.firebaseService.listenToList<Consultation>('consultations').pipe(
            catchError(() => of([])),
            switchMap(firebaseConsultations => {
                const localConsultations = JSON.parse(localStorage.getItem('telemedicine_consultations') || '[]');


                const allConsultations = [...firebaseConsultations, ...localConsultations];
                const uniqueConsultations = Array.from(new Map(allConsultations.map(item => [item['id'], item])).values());

                const filtered = uniqueConsultations.filter(c => c.patientId === user.id);
                return of(filtered);
            })
        );
    }

    /**
     * Listen to doctor's consultations (real-time)
     */
    listenToDoctorConsultations(): Observable<Consultation[]> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        return this.firebaseService.listenToList<Consultation>('consultations').pipe(
            catchError(() => of([])),
            switchMap(firebaseConsultations => {
                const localConsultations = JSON.parse(localStorage.getItem('telemedicine_consultations') || '[]');


                const allConsultations = [...firebaseConsultations, ...localConsultations];
                const uniqueConsultations = Array.from(new Map(allConsultations.map(item => [item['id'], item])).values());

                const filtered = uniqueConsultations.filter(c => c.doctorId === user.id);
                return of(filtered);
            })
        );
    }
}
