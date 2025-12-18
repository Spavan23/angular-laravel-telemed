<?php

namespace App\Services;

class AvailabilityService
{
    protected FirebaseService $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    /**
     * Check if a time slot is available (any doctor)
     */
    public function checkSlotAvailability(string $date, string $time): bool
    {
        $users = $this->firebase->getAll('users');
        $doctors = array_filter($users, function ($user) {
            return isset($user['role']) && $user['role'] === 'doctor';
        });

        foreach (array_keys($doctors) as $doctorId) {
            if ($this->isDoctorAvailable($doctorId, $date, $time)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a specific doctor is available
     */
    public function isDoctorAvailable(string $doctorId, string $date, string $time): bool
    {
        $availability = $this->firebase->get("availability/{$doctorId}/{$date}/slots/{$time}");
        
        return $availability && isset($availability['available']) && $availability['available'] === true;
    }

    /**
     * Mark a slot as booked
     */
    public function markSlotAsBooked(string $doctorId, string $date, string $time, string $consultationId): void
    {
        $this->firebase->set("availability/{$doctorId}/{$date}/slots/{$time}", [
            'available' => false,
            'consultationId' => $consultationId,
        ]);
    }

    /**
     * Set doctor availability for a specific date
     */
    public function setDoctorAvailability(string $doctorId, string $date, array $slots): void
    {
        $slotsData = [];
        
        foreach ($slots as $time) {
            $slotsData[$time] = ['available' => true];
        }

        $this->firebase->set("availability/{$doctorId}/{$date}/slots", $slotsData);
    }

    /**
     * Get doctor's availability for a date
     */
    public function getDoctorAvailability(string $doctorId, string $date): array
    {
        $slots = $this->firebase->get("availability/{$doctorId}/{$date}/slots");
        return $slots ? (array) $slots : [];
    }

    /**
     * Get all availability for a doctor
     */
    public function getAllDoctorAvailability(string $doctorId): array
    {
        $availability = $this->firebase->get("availability/{$doctorId}");
        return $availability ? (array) $availability : [];
    }

    /**
     * Remove a time slot
     */
    public function removeSlot(string $doctorId, string $date, string $time): void
    {
        $this->firebase->delete("availability/{$doctorId}/{$date}/slots/{$time}");
    }

    /**
     * Release a booked slot (e.g., if consultation is cancelled)
     */
    public function releaseSlot(string $doctorId, string $date, string $time): void
    {
        $this->firebase->set("availability/{$doctorId}/{$date}/slots/{$time}", [
            'available' => true,
        ]);
    }
}
