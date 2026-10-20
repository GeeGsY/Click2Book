
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
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class RegisterPage {
  private cdr = inject(ChangeDetectorRef);

  name = '';
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
  }

  async onSignUp(): Promise<void> {
    if (this.busy) return;

    this.message = '';

    if (this.name.trim().length < 2) {
      this.message = 'Please enter your name.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.message = 'Please enter a valid email address.';
      return;
    }

    if (this.password.length < 6) {
      this.message = 'Password must be at least 6 characters.';
      return;
    }

    this.busy = true;

    try {
      const result = await this.supabase.signUp(
        this.name,
        this.email,
        this.password,
      );

      this.password = '';

      if (result.session && result.user) {
        const profile = await this.supabase.getProfile(
          result.user.id,
        );

        this.state.attachSupabaseUser(profile);

        await this.router.navigate(['/home'], {
          replaceUrl: true,
        });
      } else {
        this.message =
          'Account created. Check your email to confirm your account, then log in.';

        this.cdr.markForCheck();
      }
    } catch (error: unknown) {
      this.message =
        error instanceof Error
          ? error.message
          : 'Could not create the account. Please try again.';
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }
}
