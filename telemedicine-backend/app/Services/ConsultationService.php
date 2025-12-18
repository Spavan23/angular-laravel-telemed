<?php

namespace App\Services;

use Carbon\Carbon;

class ConsultationService
{
    protected FirebaseService $firebase;
    protected AvailabilityService $availabilityService;

    public function __construct(FirebaseService $firebase, AvailabilityService $availabilityService)
    {
        $this->firebase = $firebase;
        $this->availabilityService = $availabilityService;
    }

    /**
     * Create a new consultation booking
     */
    public function createBooking(array $data): array
    {
        // Validate and prevent double booking
        $isAvailable = $this->availabilityService->checkSlotAvailability(
            $data['scheduledDate'],
            $data['scheduledTime']
        );

        if (!$isAvailable) {
            throw new \Exception('Selected time slot is not available');
        }

        // Find available doctor
        $doctor = $this->findAvailableDoctor($data['scheduledDate'], $data['scheduledTime']);

        if (!$doctor) {
            throw new \Exception('No doctor available for the selected time slot');
        }

        // Prepare consultation data
        $consultationData = [
            'patientId' => $data['patientId'],
            'patientName' => $data['patientName'],
            'doctorId' => $doctor['id'],
            'doctorName' => $doctor['name'],
            'scheduledDate' => $data['scheduledDate'],
            'scheduledTime' => $data['scheduledTime'],
            'reason' => $data['reason'] ?? '',
            'status' => 'Booked',
            'createdAt' => Carbon::now()->toIso8601String(),
            'updatedAt' => Carbon::now()->toIso8601String(),
        ];

        // Create consultation
        $consultationId = $this->firebase->create('consultations', $consultationData);

        // Mark slot as unavailable
        $this->availabilityService->markSlotAsBooked(
            $doctor['id'],
            $data['scheduledDate'],
            $data['scheduledTime'],
            $consultationId
        );

        return [
            'consultationId' => $consultationId,
            'consultation' => $consultationData,
        ];
    }

    /**
     * Find an available doctor for the given date and time
     */
    protected function findAvailableDoctor(string $date, string $time): ?array
    {
        // Get all doctors
        $users = $this->firebase->getAll('users');
        $doctors = array_filter($users, function ($user) {
            return isset($user['role']) && $user['role'] === 'doctor';
        });

        // Check each doctor's availability
        foreach ($doctors as $doctorId => $doctor) {
            $isAvailable = $this->availabilityService->isDoctorAvailable($doctorId, $date, $time);
            
            if ($isAvailable) {
                return [
                    'id' => $doctorId,
                    'name' => $doctor['name'],
                    'specialty' => $doctor['specialty'] ?? 'General Medicine',
                ];
            }
        }

        return null;
    }

    /**
     * Get consultations for a patient
     */
    public function getPatientConsultations(string $patientId): array
    {
        $allConsultations = $this->firebase->getAll('consultations');
        
        $patientConsultations = array_filter($allConsultations, function ($consultation) use ($patientId) {
            return isset($consultation['patientId']) && $consultation['patientId'] === $patientId;
        });

        return array_values($patientConsultations);
    }

    /**
     * Get consultations for a doctor
     */
    public function getDoctorConsultations(string $doctorId): array
    {
        $allConsultations = $this->firebase->getAll('consultations');
        
        $doctorConsultations = array_filter($allConsultations, function ($consultation) use ($doctorId) {
            return isset($consultation['doctorId']) && $consultation['doctorId'] === $doctorId;
        });

        return array_values($doctorConsultations);
    }

    /**
     * Update consultation status
     */
    public function updateStatus(string $consultationId, string $status): void
    {
        $validStatuses = ['Booked', 'In Progress', 'Completed'];
        
        if (!in_array($status, $validStatuses)) {
            throw new \Exception('Invalid status');
        }

        $this->firebase->update("consultations/{$consultationId}", [
            'status' => $status,
            'updatedAt' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Get consultation by ID
     */
    public function getConsultation(string $consultationId): ?array
    {
        return $this->firebase->get("consultations/{$consultationId}");
    }
}
