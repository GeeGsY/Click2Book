import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, heart, heartOutline, star } from 'ionicons/icons';
import { AppStateService, SavedPlace } from '../services/app-state.service';

// Extra photos for places saved without a gallery of their own.
const GALLERY_FILLER = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
];

@Component({
  selector: 'app-saved',
  templateUrl: './saved.page.html',
  styleUrls: ['./saved.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class SavedPage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  // A signal, because the app runs without zone.js.
  places = signal<SavedPlace[]>([]);

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      heart: heart,
      'heart-outline': heartOutline,
      star: star,
    });
    this.refresh();
  }

  ionViewWillEnter(): void {
    this.refresh();
    // Get the latest saved places from Supabase, then show them.
    void this.appState.refreshFavorites().then(() => this.refresh());
  }

  trackById(_: number, place: SavedPlace): number {
    return place.id;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  open(place: SavedPlace): void {
    this.router.navigate(['/destination-details'], {
      state: {
        destination: {
          ...place,
          heroImage: place.image,
          thumbnails: [place.image, ...(place.gallery ?? []), ...GALLERY_FILLER],
        },
      },
    });
  }

  unsave(place: SavedPlace, event: Event): void {
    event.stopPropagation();
    this.appState.toggleFavorite(place.id);
    this.refresh();
  }

  private refresh(): void {
    this.places.set(this.appState.savedPlaces);
  }
}