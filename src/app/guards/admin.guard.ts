import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

// Admin screens are only for the admin account. Everyone else is sent away.
export const adminGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);

  if (!state.isLoggedIn) return router.parseUrl('/login');
  return state.isAdmin ? true : router.parseUrl('/home');
};