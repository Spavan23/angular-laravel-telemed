import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            phone: ['', [Validators.required]],
            role: ['patient', [Validators.required]],
            specialty: ['']
        });

        // Watch role changes to conditionally require specialty
        this.registerForm.get('role')?.valueChanges.subscribe(role => {
            const specialtyControl = this.registerForm.get('specialty');
            if (role === 'doctor') {
                specialtyControl?.setValidators([Validators.required]);
            } else {
                specialtyControl?.clearValidators();
            }
            specialtyControl?.updateValueAndValidity();
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.authService.register(this.registerForm.value).subscribe({
            next: (response) => {
                // Redirect based on user role
                if (response.user.role === 'patient') {
                    this.router.navigate(['/patient/consultations']);
                } else if (response.user.role === 'doctor') {
                    this.router.navigate(['/doctor/dashboard']);
                }
            },
            error: (error) => {
                this.loading = false;

                this.errorMessage = error.message || error.error?.error || error.code || 'Registration failed. Please try again.';
            }
        });
    }

    get name() {
        return this.registerForm.get('name');
    }

    get email() {
        return this.registerForm.get('email');
    }

    get password() {
        return this.registerForm.get('password');
    }

    get phone() {
        return this.registerForm.get('phone');
    }

    get role() {
        return this.registerForm.get('role');
    }

    get specialty() {
        return this.registerForm.get('specialty');
    }
}
