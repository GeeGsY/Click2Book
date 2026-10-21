import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class PrivacyPage {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  // Signal, because the app runs without zone.js.
  confirmingDelete = signal(false);
  message = signal('');
  busy = signal(false);

  constructor() {
    addIcons({ 'arrow-back-outline': arrowBackOutline });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  // Two taps: Delete my account, then Yes.
  async deleteAccount(): Promise<void> {
    if (this.busy()) return;
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    this.message.set('');
    this.busy.set(true);
    const result = await this.appState.deleteAccount();
    this.busy.set(false);
    if (!result.ok) {
      this.message.set(result.error ?? 'Could not delete your account.');
      return;
    }
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}