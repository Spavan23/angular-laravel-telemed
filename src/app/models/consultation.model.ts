export interface Consultation {
    id?: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    scheduledDate: string;
    scheduledTime: string;
    reason: string;
    status: ConsultationStatus;
    createdAt: string;
    updatedAt: string;
}

export type ConsultationStatus = 'Booked' | 'In Progress' | 'Completed';

export interface BookingRequest {
    scheduledDate: string;
    scheduledTime: string;
    reason?: string;
}

export interface BookingResponse {
    message: string;
    consultation: Consultation;
    consultationId: string;
}
