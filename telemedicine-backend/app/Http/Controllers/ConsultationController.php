<?php

namespace App\Http\Controllers;

use App\Services\ConsultationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class ConsultationController extends Controller
{
    protected ConsultationService $consultationService;

    public function __construct(ConsultationService $consultationService)
    {
        $this->consultationService = $consultationService;
    }

    /**
     * Create a new consultation booking
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'scheduledDate' => 'required|date|after_or_equal:today',
            'scheduledTime' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            // Get user data from Firebase
            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'patient') {
                return response()->json(['error' => 'Only patients can book consultations'], 403);
            }

            $bookingData = [
                'patientId' => $userId,
                'patientName' => $userData['name'],
                'scheduledDate' => $request->scheduledDate,
                'scheduledTime' => $request->scheduledTime,
                'reason' => $request->reason ?? '',
            ];

            $result = $this->consultationService->createBooking($bookingData);

            return response()->json([
                'message' => 'Consultation booked successfully',
                'consultation' => $result['consultation'],
                'consultationId' => $result['consultationId'],
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get consultations for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] === 'patient') {
                $consultations = $this->consultationService->getPatientConsultations($userId);
            } elseif ($userData['role'] === 'doctor') {
                $consultations = $this->consultationService->getDoctorConsultations($userId);
            } else {
                return response()->json(['error' => 'Invalid user role'], 403);
            }

            return response()->json([
                'consultations' => $consultations,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get a specific consultation
     */
    public function show(string $id)
    {
        try {
            $consultation = $this->consultationService->getConsultation($id);

            if (!$consultation) {
                return response()->json(['error' => 'Consultation not found'], 404);
            }

            return response()->json([
                'consultation' => $consultation,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Update consultation status
     */
    public function updateStatus(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Booked,In Progress,Completed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = app(\App\Services\FirebaseService::class)->get("users/{$userId}");

            if ($userData['role'] !== 'doctor') {
                return response()->json(['error' => 'Only doctors can update consultation status'], 403);
            }

            $this->consultationService->updateStatus($id, $request->status);

            return response()->json([
                'message' => 'Consultation status updated successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
