import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

// Pages after login need an account; everyone else is sent to the Login page.
export const authGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  return state.isLoggedIn ? true : router.parseUrl('/login');
};