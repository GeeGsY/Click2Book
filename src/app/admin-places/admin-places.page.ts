import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, starOutline, star, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { PlacesService } from '../services/places.service';
import { Place, PLACE_TYPES } from '../data/place.model';

@Component({
  selector: 'app-admin-places',
  templateUrl: './admin-places.page.html',
  styleUrls: ['./admin-places.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class AdminPlacesPage {
  private router = inject(Router);
  private location = inject(Location);
  private placesService = inject(PlacesService);

  query = '';

  // Signals, because the app runs without zone.js.
  confirmDeleteId = signal<number | null>(null);
  confirmReset = signal(false);

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'add-outline': addOutline,
      'star-outline': starOutline,
      star: star,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
    });
  }

  // Reads a signal inside the service, so the list refreshes by itself.
  get filtered(): Place[] {
    const q = this.query.trim().toLowerCase();
    return this.placesService.places.filter(
      (p) => !q || `${p.name} ${p.country} ${p.provider ?? ''}`.toLowerCase().includes(q),
    );
  }

  get total(): number {
    return this.placesService.places.length;
  }

  trackById(_: number, place: Place): number {
    return place.id;
  }

  typeLabel(place: Place): string {
    return PLACE_TYPES.find((t) => t.id === place.type)?.label ?? place.type;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin']);
    }
  }

  add(): void {
    this.router.navigate(['/admin-place-form'], { state: {} });
  }

  edit(place: Place): void {
    this.router.navigate(['/admin-place-form'], { state: { placeId: place.id } });
  }

  toggleHidden(place: Place): void {
    this.placesService.setHidden(place.id, !place.hidden);
  }

  feature(place: Place): void {
    this.placesService.setFeatured(place.id);
  }

  // Two taps: Delete, then Yes.
  remove(place: Place): void {
    if (this.confirmDeleteId() !== place.id) {
      this.confirmDeleteId.set(place.id);
      return;
    }
    this.placesService.deletePlace(place.id);
    this.confirmDeleteId.set(null);
  }

  reset(): void {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    this.placesService.resetToSamples();
    this.confirmReset.set(false);
  }
}