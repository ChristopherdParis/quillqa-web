import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const rootRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdminAuthenticated()) {
    return router.createUrlTree(['/admin/tenants']);
  }

  if (auth.isAppAuthenticated()) {
    return router.createUrlTree(['/app/dashboard']);
  }

  return router.createUrlTree(['/admin/login']);
};
