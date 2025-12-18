import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css'
})
export class BookingFormComponent {
  bookingForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  // Available time slots
  timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  constructor(
    private fb: FormBuilder,
    private consultationService: ConsultationService,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];

    this.bookingForm = this.fb.group({
      scheduledDate: [today, [Validators.required]],
      scheduledTime: ['', [Validators.required]],
      reason: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.consultationService.bookConsultation(this.bookingForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Consultation booked successfully! Doctor: ' + response.consultation.doctorName;
        this.bookingForm.reset();

        // Redirect to consultations list after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/patient/consultations']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error || 'Booking failed. Please try again.';
      }
    });
  }

  get scheduledDate() {
    return this.bookingForm.get('scheduledDate');
  }

  get scheduledTime() {
    return this.bookingForm.get('scheduledTime');
  }

  get reason() {
    return this.bookingForm.get('reason');
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
