<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;
use Kreait\Firebase\Database\Reference;

class FirebaseService
{
    protected Database $database;

    public function __construct()
    {
        $credentialsPath = storage_path('app/' . env('FIREBASE_CREDENTIALS'));
        $databaseUrl = env('FIREBASE_DATABASE_URL');

        $factory = (new Factory)
            ->withServiceAccount($credentialsPath)
            ->withDatabaseUri($databaseUrl);

        $this->database = $factory->createDatabase();
    }

    /**
     * Get a reference to a database path
     */
    public function getReference(string $path): Reference
    {
        return $this->database->getReference($path);
    }

    /**
     * Create a new record
     */
    public function create(string $path, array $data): string
    {
        $reference = $this->getReference($path);
        $newRef = $reference->push($data);
        return $newRef->getKey();
    }

    /**
     * Update an existing record
     */
    public function update(string $path, array $data): void
    {
        $this->getReference($path)->update($data);
    }

    /**
     * Delete a record
     */
    public function delete(string $path): void
    {
        $this->getReference($path)->remove();
    }

    /**
     * Get a single record
     */
    public function get(string $path)
    {
        return $this->getReference($path)->getValue();
    }

    /**
     * Query records with filters
     */
    public function query(string $path, array $filters = [])
    {
        $reference = $this->getReference($path);
        
        if (isset($filters['orderBy'])) {
            $reference = $reference->orderByChild($filters['orderBy']);
        }
        
        if (isset($filters['equalTo'])) {
            $reference = $reference->equalTo($filters['equalTo']);
        }
        
        if (isset($filters['limitToFirst'])) {
            $reference = $reference->limitToFirst($filters['limitToFirst']);
        }
        
        if (isset($filters['limitToLast'])) {
            $reference = $reference->limitToLast($filters['limitToLast']);
        }
        
        return $reference->getValue();
    }

    /**
     * Set a value at a specific path
     */
    public function set(string $path, $value): void
    {
        $this->getReference($path)->set($value);
    }

    /**
     * Get all records from a path
     */
    public function getAll(string $path): array
    {
        $data = $this->get($path);
        return $data ? (array) $data : [];
    }
}
