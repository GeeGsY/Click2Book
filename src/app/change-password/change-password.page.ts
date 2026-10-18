import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class ChangePasswordPage {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  current = '';
  next = '';
  confirm = '';

  // Signals, because the app runs without zone.js.
  message = signal('');
  success = signal(false);
  busy = signal(false);
  showPasswords = signal(false);

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  async save(): Promise<void> {
    if (this.busy()) return;
    this.message.set('');
    this.success.set(false);

    if (!this.current || !this.next) {
      this.message.set('Please fill in your current and new password.');
      return;
    }
    if (this.next !== this.confirm) {
      this.message.set('The new passwords do not match.');
      return;
    }

    this.busy.set(true);
    const result = await this.appState.changePassword(this.current, this.next);
    this.busy.set(false);

    if (result.ok) {
      this.current = this.next = this.confirm = '';
      this.success.set(true);
      this.message.set('Your password was changed.');
    } else {
      this.message.set(result.error ?? 'Could not change your password.');
    }
  }
}