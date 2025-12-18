<?php

namespace App\Http\Controllers;

use App\Services\AvailabilityService;
use App\Services\ConsultationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class DoctorController extends Controller
{
    protected AvailabilityService $availabilityService;
    protected ConsultationService $consultationService;

    public function __construct(
        AvailabilityService $availabilityService,
        ConsultationService $consultationService
    ) {
        $this->availabilityService = $availabilityService;
        $this->consultationService = $consultationService;
    }

    /**
     * Get doctor's assigned consultations
     */
    public function getAssignedConsultations(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'doctor') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $consultations = $this->consultationService->getDoctorConsultations($userId);

            return response()->json([
                'consultations' => $consultations,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get doctor's availability
     */
    public function getAvailability(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'doctor') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $availability = $this->availabilityService->getAllDoctorAvailability($userId);

            return response()->json([
                'availability' => $availability,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Set doctor's availability for a specific date
     */
    public function setAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
            'slots' => 'required|array',
            'slots.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'doctor') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $this->availabilityService->setDoctorAvailability(
                $userId,
                $request->date,
                $request->slots
            );

            return response()->json([
                'message' => 'Availability updated successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Remove a specific time slot
     */
    public function removeSlot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'time' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'doctor') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $this->availabilityService->removeSlot($userId, $request->date, $request->time);

            return response()->json([
                'message' => 'Slot removed successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
