import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BookingFormComponent } from './components/patient/booking-form/booking-form.component';
import { ConsultationListComponent } from './components/patient/consultation-list/consultation-list.component';
import { DoctorDashboardComponent } from './components/doctor/doctor-dashboard/doctor-dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // Patient routes
    {
        path: 'patient/consultations',
        component: ConsultationListComponent,
        canActivate: [AuthGuard],
        data: { role: 'patient' }
    },
    {
        path: 'patient/book',
        component: BookingFormComponent,
        canActivate: [AuthGuard],
        data: { role: 'patient' }
    },

    // Doctor routes
    {
        path: 'doctor/dashboard',
        component: DoctorDashboardComponent,
        canActivate: [AuthGuard],
        data: { role: 'doctor' }
    },

    // Fallback
    { path: '**', redirectTo: '/login' }
];
