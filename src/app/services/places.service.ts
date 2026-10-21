import { Injectable, inject, signal } from '@angular/core';
import { Place, PlaceType, STAY_POLICY, TYPE_CATEGORY } from '../data/place.model';
import { SEED_PLACES } from '../data/place-seed';
import { SupabaseService } from './supabase.service';

export interface PlaceInput {
  name: string;
  type: PlaceType;
  country: string; // location text, for example "Santa Ana, Cagayan"
  price: number;
  description: string;
  image: string;
  gallery: string[]; // up to 2 extra photos shown under the main photo
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

// How a row looks in the Supabase "places" table (see places.sql).
interface PlaceRow {
  id: number;
  name: string;
  type: PlaceType;
  location: string;
  price: number;
  rating: number;
  review_count: number;
  image: string;
  categories: string[] | null;
  popular: boolean;
  description: string;
  provider: string | null;
  hidden: boolean;
  featured: boolean;
  gallery: string[] | null;
}

function fromRow(row: PlaceRow): Place {
  return {
    id: Number(row.id),
    name: row.name,
    type: row.type,
    country: row.location,
    price: row.price,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    image: row.image,
    categories: row.categories ?? [],
    popular: row.popular,
    description: row.description,
    provider: row.provider ?? undefined,
    hidden: row.hidden,
    featured: row.featured,
    gallery: row.gallery ?? undefined,
  };
}

function toRow(place: Place): Omit<PlaceRow, 'id'> & { id: number } {
  return {
    id: place.id,
    name: place.name,
    type: place.type,
    location: place.country,
    price: place.price,
    rating: place.rating,
    review_count: place.reviewCount,
    image: place.image,
    categories: place.categories,
    popular: place.popular,
    description: place.description,
    provider: place.provider ?? null,
    hidden: !!place.hidden,
    featured: !!place.featured,
    gallery: place.gallery ?? null,
  };
}

/**
 * The list of places everyone sees. Admins change it; Home reads it.
 * The places live in the Supabase "places" table, so a place added by the admin on one
 * device shows up for every user. Row Level Security makes sure only admins can change it.
 *
 * Screens still read the getters below (they stay synchronous); the list is loaded from
 * Supabase in the background and the signal makes the screens refresh when it arrives.
 */
@Injectable({ providedIn: 'root' })
export class PlacesService {
  private supabase = inject(SupabaseService);

  private list: Place[] = [];

  // Bumped on every change so screens that read the getters below refresh by themselves
  // (the app runs without zone.js).
  private revision = signal(0);

  // True until the first load from Supabase finishes.
  readonly loading = signal(true);
  // Set when the places could not be loaded (offline, table missing...).
  readonly loadError = signal('');

  private loadedOnce = false;

  constructor() {
    void this.refresh();
    // Logging in or out changes what the database lets us read (admins also see hidden places).
    this.supabase.supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void this.refresh(), 0);
    });
  }

  // ---------- Reading ----------

  // Every place the database gives us, including hidden ones for admins (for the admin screens).
  get places(): Place[] {
    this.revision();
    return this.list;
  }

  // What users see.
  get visiblePlaces(): Place[] {
    this.revision();
    return this.list.filter((p) => !p.hidden);
  }

  get featuredPlace(): Place | null {
    const visible = this.visiblePlaces;
    return visible.find((p) => p.featured) ?? visible[0] ?? null;
  }

  getPlace(id: number): Place | null {
    this.revision();
    return this.list.find((p) => p.id === id) ?? null;
  }

  // Loads the places again from Supabase.
  async refresh(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('places')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.loadError.set(error.message);
      // Never leave the app empty on the very first load: show the sample places instead.
      if (!this.loadedOnce) {
        this.list = JSON.parse(JSON.stringify(SEED_PLACES)) as Place[];
      }
    } else {
      this.loadedOnce = true;
      this.loadError.set('');
      this.list = (data as PlaceRow[]).map(fromRow);
    }
    this.loading.set(false);
    this.bump();
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
  async savePlace(input: PlaceInput, id?: number): Promise<PlaceResult> {
    const problem = this.validate(input);
    if (problem) return { ok: false, error: problem };

    const typeCategory = TYPE_CATEGORY[input.type];
    const categories = [...new Set([...(typeCategory ? [typeCategory] : []), ...input.tags])];
    const gallery = input.gallery.map((g) => g.trim()).filter(Boolean).slice(0, 2);
    const description = /cancellation/i.test(input.description)
      ? input.description.trim()
      : input.description.trim() + STAY_POLICY;

    const fields = {
      name: input.name.trim(),
      type: input.type,
      location: input.country.trim(),
      price: Math.round(input.price),
      rating: Math.round(input.rating * 10) / 10,
      review_count: Math.round(input.reviewCount),
      image: input.image.trim(),
      categories,
      popular: input.popular,
      description,
      provider: input.provider.trim() || null,
      hidden: input.hidden,
      gallery: gallery.length ? gallery : null,
    };

    const query =
      id === undefined
        ? this.supabase.supabase.from('places').insert(fields)
        : this.supabase.supabase.from('places').update(fields).eq('id', id);

    const { data, error } = await query.select().single();
    if (error) return { ok: false, error: this.explain(error.message) };

    const place = fromRow(data as PlaceRow);
    // A hidden place cannot be the featured one
    if (place.hidden && place.featured) {
      await this.supabase.supabase.from('places').update({ featured: false }).eq('id', place.id);
      place.featured = false;
    }
    await this.refresh();
    return { ok: true, place };
  }

  async setHidden(id: number, hidden: boolean): Promise<PlaceResult> {
    const changes = hidden ? { hidden, featured: false } : { hidden };
    const { error } = await this.supabase.supabase.from('places').update(changes).eq('id', id);
    if (error) return { ok: false, error: this.explain(error.message) };
    await this.refresh();
    return { ok: true };
  }

  // Only one place can be featured at a time (done in one step by a database function).
  async setFeatured(id: number): Promise<PlaceResult> {
    const { error } = await this.supabase.supabase.rpc('set_featured_place', { p_id: id });
    if (error) return { ok: false, error: this.explain(error.message) };
    await this.refresh();
    return { ok: true };
  }

  async deletePlace(id: number): Promise<PlaceResult> {
    const { error } = await this.supabase.supabase.from('places').delete().eq('id', id);
    if (error) return { ok: false, error: this.explain(error.message) };
    await this.refresh();
    return { ok: true };
  }

  // Brings back the places the app started with.
  async resetToSamples(): Promise<PlaceResult> {
    const samples = (JSON.parse(JSON.stringify(SEED_PLACES)) as Place[]).map(toRow);
    const keepIds = samples.map((s) => s.id);

    const removed = await this.supabase.supabase
      .from('places')
      .delete()
      .not('id', 'in', `(${keepIds.join(',')})`);
    if (removed.error) return { ok: false, error: this.explain(removed.error.message) };

    const restored = await this.supabase.supabase.from('places').upsert(samples, { onConflict: 'id' });
    if (restored.error) return { ok: false, error: this.explain(restored.error.message) };

    await this.refresh();
    return { ok: true };
  }

  // ---------- Internals ----------

  private bump(): void {
    this.revision.update((v) => v + 1);
  }

  private explain(message: string): string {
    if (/row-level security|permission denied|only an admin/i.test(message)) {
      return 'Only an admin can change places. Please log in with an admin account.';
    }
    return message;
  }
}