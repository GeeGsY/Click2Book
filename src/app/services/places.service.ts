import { Injectable, signal } from '@angular/core';
import { Place, PlaceType, STAY_POLICY, TYPE_CATEGORY } from '../data/place.model';
import { SEED_PLACES } from '../data/place-seed';

export interface PlaceInput {
  name: string;
  type: PlaceType;
  country: string; // location text, for example "Santa Ana, Cagayan"
  price: number;
  description: string;
  image: string;
  tags: string[]; // extra categories such as beach or nature
  provider: string;
  rating: number;
  reviewCount: number;
  popular: boolean;
  hidden: boolean;
}

export interface PlaceResult {
  ok: boolean;
  error?: string;
  place?: Place;
}

interface PlaceStore {
  places: Place[];
  nextId: number; // ids are never reused, so saved places and bookings keep pointing at the right place
}

const STORAGE_KEY = 'click2book.places.v1';

/**
 * The list of places everyone sees. Admins change it; Home reads it.
 * It is saved in the browser's localStorage because the prototype has no server yet,
 * so a place added on one device does not appear on another.
 */
@Injectable({ providedIn: 'root' })
export class PlacesService {
  private store: PlaceStore = this.load();

  // Bumped on every change so screens that read the getters below refresh by themselves
  // (the app runs without zone.js).
  private revision = signal(0);

  // ---------- Reading ----------

  // Every place, including hidden ones (for the admin screens).
  get places(): Place[] {
    this.revision();
    return this.store.places;
  }

  // What users see.
  get visiblePlaces(): Place[] {
    this.revision();
    return this.store.places.filter((p) => !p.hidden);
  }

  get featuredPlace(): Place | null {
    const visible = this.visiblePlaces;
    return visible.find((p) => p.featured) ?? visible[0] ?? null;
  }

  getPlace(id: number): Place | null {
    this.revision();
    return this.store.places.find((p) => p.id === id) ?? null;
  }

  // ---------- Changing (admin) ----------

  validate(input: PlaceInput): string | null {
    if (input.name.trim().length < 2) return 'Please enter the name of the place.';
    if (input.country.trim().length < 2) return 'Please enter where it is, like "Santa Ana, Cagayan".';
    if (!Number.isFinite(input.price) || input.price < 100) return 'The price per night must be at least ₱100.';
    if (input.description.trim().length < 10) return 'Please add a short description (at least 10 characters).';
    if (!input.image.trim()) return 'Please add a photo or an image link.';
    if (!Number.isFinite(input.rating) || input.rating < 0 || input.rating > 5) return 'The rating must be between 0 and 5.';
    if (!Number.isFinite(input.reviewCount) || input.reviewCount < 0) return 'The number of reviews cannot be negative.';
    return null;
  }

  // Adds a place, or updates the one with this id.
  savePlace(input: PlaceInput, id?: number): PlaceResult {
    const problem = this.validate(input);
    if (problem) return { ok: false, error: problem };

    const typeCategory = TYPE_CATEGORY[input.type];
    const categories = [...new Set([...(typeCategory ? [typeCategory] : []), ...input.tags])];
    const description = /cancellation/i.test(input.description)
      ? input.description.trim()
      : input.description.trim() + STAY_POLICY;

    const fields = {
      name: input.name.trim(),
      type: input.type,
      country: input.country.trim(),
      price: Math.round(input.price),
      rating: Math.round(input.rating * 10) / 10,
      reviewCount: Math.round(input.reviewCount),
      image: input.image.trim(),
      categories,
      popular: input.popular,
      description,
      provider: input.provider.trim() || undefined,
      hidden: input.hidden,
    };

    const before = JSON.stringify(this.store);
    let place: Place;
    const existing = id === undefined ? undefined : this.store.places.find((p) => p.id === id);

    if (existing) {
      Object.assign(existing, fields);
      place = existing;
    } else {
      place = { id: this.store.nextId, ...fields };
      this.store.nextId += 1;
      this.store.places.push(place);
    }

    if (!this.save()) {
      // Roll back when the browser has no room left (large photos fill it up quickly)
      this.store = JSON.parse(before) as PlaceStore;
      return { ok: false, error: 'There is not enough storage left for this photo. Use a smaller photo or an image link.' };
    }
    return { ok: true, place };
  }

  setHidden(id: number, hidden: boolean): void {
    const place = this.store.places.find((p) => p.id === id);
    if (!place) return;
    place.hidden = hidden;
    if (hidden) place.featured = false;
    this.save();
  }

  // Only one place can be featured at a time.
  setFeatured(id: number): void {
    this.store.places.forEach((p) => (p.featured = p.id === id));
    this.save();
  }

  deletePlace(id: number): void {
    this.store.places = this.store.places.filter((p) => p.id !== id);
    this.save();
  }

  // Brings back the places the app started with.
  resetToSamples(): void {
    this.store = this.seed();
    this.save();
  }

  // ---------- Internals ----------

  private seed(): PlaceStore {
    const places = JSON.parse(JSON.stringify(SEED_PLACES)) as Place[];
    return { places, nextId: Math.max(0, ...places.map((p) => p.id)) + 1 };
  }

  private load(): PlaceStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlaceStore>;
        if (Array.isArray(parsed.places) && typeof parsed.nextId === 'number') {
          return { places: parsed.places, nextId: parsed.nextId };
        }
      }
    } catch {
      // fall through to the sample places
    }
    return this.seed();
  }

  private save(): boolean {
    this.revision.update((v) => v + 1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      return true;
    } catch {
      return false;
    }
  }
}