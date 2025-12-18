import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database, set } from 'firebase/database';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FirebaseService {
    private database: Database;

    constructor() {
        const app = initializeApp(environment.firebase);
        this.database = getDatabase(app);
    }

    /**
     * Listen to real-time updates at a specific path
     */
    listen<T>(path: string): Observable<T | null> {
        return new Observable(observer => {
            const dbRef = ref(this.database, path);

            const callback = (snapshot: any) => {
                observer.next(snapshot.val());
            };

            onValue(dbRef, callback, (error) => {
                observer.error(error);
            });

            // Cleanup on unsubscribe
            return () => {
                off(dbRef, 'value', callback);
            };
        });
    }

    /**
     * Listen to a list of items
     */
    listenToList<T>(path: string): Observable<T[]> {
        return new Observable(observer => {
            const dbRef = ref(this.database, path);

            const callback = (snapshot: any) => {
                const data = snapshot.val();
                if (data) {
                    const items = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    observer.next(items);
                } else {
                    observer.next([]);
                }
            };

            onValue(dbRef, callback, (error) => {
                observer.error(error);
            });

            // Cleanup on unsubscribe
            return () => {
                off(dbRef, 'value', callback);
            };
        });
    }

    /**
     * Write data to a specific path (replaces existing data)
     */
    async write(path: string, data: any): Promise<void> {
        const dbRef = ref(this.database, path);
        return set(dbRef, data);
    }

    /**
     * Update data at a specific path (merges with existing data)
     */
    async update(path: string, data: any): Promise<void> {
        const dbRef = ref(this.database, path);
        // Firebase set() can also be used with update() logic if implemented correctly,
        // but for simplicity in this standalone mode, we'll use set for now
        // as the data structures are simple.
        return set(dbRef, data);
    }
}
