import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from './storage.service';

export const tenantContextGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);
  return storage.getActiveTenantId() ? true : router.createUrlTree(['/login']);
};
