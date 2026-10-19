import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, imageOutline } from 'ionicons/icons';
import { PlaceInput, PlacesService } from '../services/places.service';
import { PLACE_TYPES, PlaceType, TAG_OPTIONS } from '../data/place.model';
import { fileToDataUrl } from '../utils/image';

@Component({
  selector: 'app-admin-place-form',
  templateUrl: './admin-place-form.page.html',
  styleUrls: ['./admin-place-form.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class AdminPlaceFormPage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private placesService = inject(PlacesService);

  readonly types = PLACE_TYPES;
  readonly tagOptions = TAG_OPTIONS;

  // Plain fields (typed into inputs)
  name = '';
  country = '';
  price: number | null = null;
  description = '';
  provider = '';
  imageUrl = '';
  rating = 4.5;
  reviewCount = 0;
  popular = false;
  visible = true;

  // Signals, because the app runs without zone.js.
  type = signal<PlaceType>('resort');
  tags = signal<string[]>([]);
  image = signal('');
  message = signal('');
  busy = signal(false);

  placeId: number | undefined;

  constructor() {
    addIcons({ 'arrow-back-outline': arrowBackOutline, 'image-outline': imageOutline });
    this.load(this.router.getCurrentNavigation()?.extras?.state);
  }

  ionViewWillEnter(): void {
    this.load(history.state);
  }

  get isEditing(): boolean {
    return this.placeId !== undefined;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin-places']);
    }
  }

  toggleTag(id: string): void {
    this.tags.update((list) => (list.includes(id) ? list.filter((t) => t !== id) : [...list, id]));
  }

  // The image link box is a second way to set the photo.
  onImageUrlChange(): void {
    this.image.set(this.imageUrl.trim());
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.message.set('');
    this.busy.set(true);
    try {
      this.image.set(await fileToDataUrl(file));
      this.imageUrl = '';
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Could not read that photo.');
    } finally {
      this.busy.set(false);
      input.value = '';
    }
  }

  save(): void {
    const input: PlaceInput = {
      name: this.name,
      type: this.type(),
      country: this.country,
      price: Number(this.price),
      description: this.description,
      image: this.image(),
      tags: this.tags(),
      provider: this.provider,
      rating: Number(this.rating),
      reviewCount: Number(this.reviewCount),
      popular: this.popular,
      hidden: !this.visible,
    };

    const result = this.placesService.savePlace(input, this.placeId);
    if (result.ok) {
      this.goBack();
    } else {
      this.message.set(result.error ?? 'Could not save this place.');
    }
  }

  private load(navState: unknown): void {
    const { placeId } = (navState ?? {}) as { placeId?: number };
    this.placeId = placeId;
    this.message.set('');

    const place = placeId === undefined ? null : this.placesService.getPlace(placeId);
    if (!place) {
      // A new place starts empty
      this.placeId = undefined;
      this.name = this.country = this.description = this.provider = this.imageUrl = '';
      this.price = null;
      this.rating = 4.5;
      this.reviewCount = 0;
      this.popular = false;
      this.visible = true;
      this.type.set('resort');
      this.tags.set([]);
      this.image.set('');
      return;
    }

    this.name = place.name;
    this.country = place.country;
    this.price = place.price;
    this.description = place.description;
    this.provider = place.provider ?? '';
    this.rating = place.rating;
    this.reviewCount = place.reviewCount;
    this.popular = place.popular;
    this.visible = !place.hidden;
    this.type.set(place.type);
    this.tags.set(place.categories.filter((c) => this.tagOptions.some((t) => t.id === c)));
    this.image.set(place.image);
    // only show a link in the box; uploaded photos are long data
    this.imageUrl = place.image.startsWith('data:') ? '' : place.image;
  }
}