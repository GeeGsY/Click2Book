import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addOutline, starOutline, star, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { PlaceResult, PlacesService } from '../services/places.service';
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
  message = signal('');

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

  // Get the latest list (and, for admins, the hidden places) every time the screen opens.
  ionViewWillEnter(): void {
    void this.placesService.refresh();
  }

  // Shows the error from the database, or clears the message when it worked.
  private report(result: PlaceResult): void {
    this.message.set(result.ok ? '' : (result.error ?? 'Something went wrong.'));
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

  async toggleHidden(place: Place): Promise<void> {
    this.report(await this.placesService.setHidden(place.id, !place.hidden));
  }

  // Any number of places can be featured; Home slides through them.
  async toggleFeatured(place: Place): Promise<void> {
    this.report(await this.placesService.setFeatured(place.id, !place.featured));
  }

  // Two taps: Delete, then Yes.
  async remove(place: Place): Promise<void> {
    if (this.confirmDeleteId() !== place.id) {
      this.confirmDeleteId.set(place.id);
      return;
    }
    this.confirmDeleteId.set(null);
    this.report(await this.placesService.deletePlace(place.id));
  }

  async reset(): Promise<void> {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    this.confirmReset.set(false);
    this.report(await this.placesService.resetToSamples());
  }
}