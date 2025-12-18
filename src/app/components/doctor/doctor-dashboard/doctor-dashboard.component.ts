import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, ConsultationStatus } from '../../../models/consultation.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  consultations: Consultation[] = [];
  loading = true;
  updatingStatus: { [key: string]: boolean } = {};
  private subscription?: Subscription;

  constructor(private consultationService: ConsultationService) { }

  ngOnInit(): void {
    this.loadConsultations();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadConsultations(): void {
    // Use real-time listener for live updates
    this.subscription = this.consultationService.listenToDoctorConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations.sort((a, b) => {
          // Sort by date and time
          const dateA = new Date(a.scheduledDate + ' ' + a.scheduledTime);
          const dateB = new Date(b.scheduledDate + ' ' + b.scheduledTime);
          return dateB.getTime() - dateA.getTime();
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.loading = false;
      }
    });
  }

  updateStatus(consultationId: string | undefined, newStatus: ConsultationStatus): void {
    if (!consultationId) return;

    this.updatingStatus[consultationId] = true;

    this.consultationService.updateStatus(consultationId, newStatus).subscribe({
      next: () => {
        this.updatingStatus[consultationId] = false;
        // Real-time listener will automatically update the UI
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.updatingStatus[consultationId] = false;
        alert('Failed to update status. Please try again.');
      }
    });
  }

  getStatusClass(status: ConsultationStatus): string {
    switch (status) {
      case 'Booked':
        return 'status-booked';
      case 'In Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getNextStatus(currentStatus: ConsultationStatus): ConsultationStatus | null {
    switch (currentStatus) {
      case 'Booked':
        return 'In Progress';
      case 'In Progress':
        return 'Completed';
      default:
        return null;
    }
  }

  getStatusButtonText(currentStatus: ConsultationStatus): string {
    const nextStatus = this.getNextStatus(currentStatus);
    return nextStatus ? `Mark as ${nextStatus}` : '';
  }
}
