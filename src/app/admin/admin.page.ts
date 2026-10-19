import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, receiptOutline, chevronForward, logOutOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';
import { PlacesService } from '../services/places.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AdminPage {
  private router = inject(Router);
  private appState = inject(AppStateService);
  private placesService = inject(PlacesService);

  constructor() {
    addIcons({
      'business-outline': businessOutline,
      'receipt-outline': receiptOutline,
      'chevron-forward': chevronForward,
      'log-out-outline': logOutOutline,
    });
  }

  // These read signals inside the services, so the numbers refresh by themselves.
  get email(): string {
    return this.appState.user?.email ?? '';
  }

  get stats() {
    return this.appState.adminStats;
  }

  get totalPlaces(): number {
    return this.placesService.places.length;
  }

  get visiblePlaces(): number {
    return this.placesService.visiblePlaces.length;
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.appState.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}