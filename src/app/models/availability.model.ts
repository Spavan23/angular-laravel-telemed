export interface AvailabilitySlot {
    available: boolean;
    consultationId?: string;
}

export interface DayAvailability {
    slots: { [time: string]: AvailabilitySlot };
}

export interface DoctorAvailability {
    [date: string]: DayAvailability;
}

export interface SetAvailabilityRequest {
    date: string;
    slots: string[];
}
