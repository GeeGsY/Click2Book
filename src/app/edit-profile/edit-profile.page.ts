import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class EditProfilePage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  name = '';
  phone = '';
  email = '';

  // A signal, because the app runs without zone.js.
  message = signal('');
  busy = signal(false);

  constructor() {
    addIcons({ 'arrow-back-outline': arrowBackOutline });
    this.load();
  }

  ionViewWillEnter(): void {
    this.load();
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
    this.busy.set(true);
    const result = await this.appState.updateProfile(this.name, this.phone);
    this.busy.set(false);
    if (result.ok) {
      this.goBack();
    } else {
      this.message.set(result.error ?? 'Could not save your changes.');
    }
  }

  private load(): void {
    const user = this.appState.user;
    this.name = user?.name ?? '';
    this.phone = user?.phone ?? '';
    this.email = user?.email ?? '';
    this.message.set('');
  }
}