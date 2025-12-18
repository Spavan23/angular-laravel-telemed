import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (this.authService.isAuthenticated()) {
            // Check for required role if specified
            const requiredRole = route.data['role'];

            if (requiredRole && !this.authService.hasRole(requiredRole)) {
                // User doesn't have required role
                this.router.navigate(['/']);
                return false;
            }

            return true;
        }

        // Not authenticated - redirect to login
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
