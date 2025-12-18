import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, ConsultationStatus } from '../../../models/consultation.model';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consultation-list.component.html',
  styleUrl: './consultation-list.component.css'
})
export class ConsultationListComponent implements OnInit, OnDestroy {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  loading = true;
  selectedStatus: string = 'all';
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
    this.subscription = this.consultationService.listenToPatientConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.filterConsultations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.loading = false;
      }
    });
  }

  filterConsultations(): void {
    if (this.selectedStatus === 'all') {
      this.filteredConsultations = this.consultations;
    } else {
      this.filteredConsultations = this.consultations.filter(
        c => c.status === this.selectedStatus
      );
    }
  }

  onFilterChange(status: string): void {
    this.selectedStatus = status;
    this.filterConsultations();
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
}
