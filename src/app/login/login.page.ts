import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  location,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';

import { AppStateService } from '../services/app-state.service';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class LoginPage {
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  showPassword = false;
  message = '';
  busy = false;

  constructor(
    private state: AppStateService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({
      location,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
    });

    // A reset-password email can send the guest here instead of the reset page
    // (for example when the redirect address is not allowed in Supabase yet).
    const link = window.location.hash;
    if (/type=recovery/.test(link) && /access_token=/.test(link)) {
      // Supabase already signed them in for a moment: continue on the "new password" page.
      this.router.navigate(['/reset-password'], { replaceUrl: true });
    } else if (/error_code=otp_expired|error=access_denied/.test(link)) {
      this.message =
        'That reset link has expired or was already used. Enter your email and tap "Forgot password?" to get a new one.';
    }
  }

  async onLogin(): Promise<void> {
    if (this.busy) return;

    this.message = '';

    if (!this.email.trim() || !this.password) {
      this.message = 'Please enter your email and password.';
      return;
    }

    this.busy = true;

    try {
      const result = await this.supabase.signIn(
        this.email,
        this.password,
      );

      this.state.attachSupabaseUser(result.profile);
      this.password = '';

      await this.router.navigate(
        [result.profile.role === 'admin' ? '/admin' : '/home'],
        { replaceUrl: true },
      );
    } catch (error: unknown) {
      this.message =
        error instanceof Error
          ? error.message
          : 'Could not log in. Please try again.';
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  async onForgotPassword(): Promise<void> {
    if (!this.email.trim()) {
      this.message = 'Enter your email address first.';
      return;
    }

    this.busy = true;
    this.message = '';

    try {
      await this.supabase.resetPassword(this.email);
      this.message =
        'If your account exists, check your email for password recovery instructions.';
    } catch {
      this.message =
        'Could not request password recovery. Please try again.';
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  onSignUp(): void {
    this.router.navigate(['/register']);
  }
}