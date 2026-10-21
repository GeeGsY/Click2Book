import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

import { AppStateService } from '../services/app-state.service';
import { SupabaseService } from '../services/supabase.service';

type Step = 'checking' | 'form' | 'invalid' | 'done';

// The page the "reset your password" email opens.
// Supabase reads the link and signs the guest in for a moment (a "recovery" session),
// then this page lets them choose a new password.
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class ResetPasswordPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private appState = inject(AppStateService);

  // Signals, because the app runs without zone.js.
  step = signal<Step>('checking');
  message = signal('');
  busy = signal(false);
  showPassword = signal(false);

  password = '';
  confirm = '';

  private unsubscribe?: () => void;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    addIcons({ 'eye-outline': eyeOutline, 'eye-off-outline': eyeOffOutline });
  }

  async ngOnInit(): Promise<void> {
    // A link that failed or expired comes back with an error in the address.
    const address = `${window.location.search}${window.location.hash}`;
    if (/error(_code|_description)?=/i.test(address)) {
      this.step.set('invalid');
      return;
    }

    // Supabase needs a moment to read the link, so wait for the login it creates.
    const { data } = this.supabase.supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        this.showForm();
      }
    });
    this.unsubscribe = () => data.subscription.unsubscribe();

    const { data: current } = await this.supabase.supabase.auth.getSession();
    if (current.session) {
      this.showForm();
      return;
    }

    // Nothing arrived after a few seconds: the link is missing, used already or expired.
    this.timer = setTimeout(() => {
      if (this.step() === 'checking') this.step.set('invalid');
    }, 4000);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    if (this.timer) clearTimeout(this.timer);
  }

  async save(): Promise<void> {
    if (this.busy()) return;
    this.message.set('');

    if (this.password.length < 6) {
      this.message.set('The new password must be at least 6 characters.');
      return;
    }
    if (this.password !== this.confirm) {
      this.message.set('The passwords do not match.');
      return;
    }

    this.busy.set(true);
    const { error } = await this.supabase.supabase.auth.updateUser({ password: this.password });
    if (error) {
      this.busy.set(false);
      this.message.set(error.message);
      return;
    }

    // Log out the temporary recovery session, so the guest logs in again with the new password.
    await this.appState.logout().catch(() => undefined);
    this.password = this.confirm = '';
    this.busy.set(false);
    this.step.set('done');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private showForm(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.step() === 'checking') this.step.set('form');
  }
}