
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const state = inject(AppStateService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data, error } =
    await supabase.supabase.auth.getSession();

  if (error || !data.session) {
    await state.logout();
    return router.parseUrl('/login');
  }

  try {
    const profile = await supabase.getProfile(
      data.session.user.id,
    );

    state.attachSupabaseUser(profile);
    return true;
  } catch {
    await state.logout();
    return router.parseUrl('/login');
  }
};
