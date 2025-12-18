<?php

namespace App\Http\Controllers;

use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class AuthController extends Controller
{
    protected FirebaseService $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:6',
            'role' => 'required|in:patient,doctor',
            'phone' => 'required|string',
            'specialty' => 'required_if:role,doctor|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if email already exists
        $users = $this->firebase->getAll('users');
        foreach ($users as $user) {
            if (isset($user['email']) && $user['email'] === $request->email) {
                return response()->json(['error' => 'Email already registered'], 409);
            }
        }

        // Create user data
        $userData = [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'createdAt' => Carbon::now()->toIso8601String(),
        ];

        if ($request->role === 'doctor') {
            $userData['specialty'] = $request->specialty;
        }

        // Create user in Firebase
        $userId = $this->firebase->create('users', $userData);

        // Generate JWT token
        $token = JWTAuth::fromUser((object) ['id' => $userId]);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => array_merge(['id' => $userId], $userData),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find user by email
        $users = $this->firebase->getAll('users');
        $user = null;
        $userId = null;

        foreach ($users as $id => $userData) {
            if (isset($userData['email']) && $userData['email'] === $request->email) {
                $user = $userData;
                $userId = $id;
                break;
            }
        }

        if (!$user || !Hash::check($request->password, $user['password'])) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Generate JWT token
        $token = JWTAuth::fromUser((object) ['id' => $userId]);

        // Remove password from response
        unset($user['password']);

        return response()->json([
            'message' => 'Login successful',
            'user' => array_merge(['id' => $userId], $user),
            'token' => $token,
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            $userId = $user->id;

            $userData = $this->firebase->get("users/{$userId}");

            if (!$userData) {
                return response()->json(['error' => 'User not found'], 404);
            }

            unset($userData['password']);

            return response()->json([
                'user' => array_merge(['id' => $userId], $userData),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
    }

    /**
     * Logout user
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Successfully logged out']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to logout'], 500);
        }
    }
}
