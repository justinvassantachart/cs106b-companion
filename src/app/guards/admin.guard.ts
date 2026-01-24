import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
    const adminService = inject(AdminService);
    const router = inject(Router);

    // Wait for loading to complete, then check admin status
    return toObservable(adminService.isLoading).pipe(
        filter(loading => !loading),
        take(1),
        map(() => {
            if (adminService.isAdmin()) {
                return true;
            } else {
                console.log('[AdminGuard] Access denied - user is not admin');
                router.navigate(['/']);
                return false;
            }
        })
    );
};
