import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { PlacesService } from '../services/places.service';
import { CATEGORY_OPTIONS } from '../data/place.model';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  personCircleOutline,
  notificationsOutline,
  searchOutline,
  heart,
  heartOutline,
  star,
  arrowForward
} from 'ionicons/icons';


interface Category {
  id: string;
  label: string;
}


interface Destination {
  id: number;
  name: string;
  country: string;

  // Demo booking price per night in Philippine peso
  price: number;

  rating: number;
  reviewCount: number;

  image: string;

  // Used by the category filter
  categories: string[];

  // Used to determine which destinations appear
  // under "Popular this week"
  popular: boolean;


  description: string;

  // Up to 2 extra photos chosen by the admin (shown as the 2nd and 3rd picture)
  gallery?: string[];
}


// Common booking policy shown in the destination description.
const STAY_POLICY =
  ' Check-in is from 2:00 PM and check-out is 11:00 AM. Free cancellation up to 48 hours before arrival.';


// Stock photos used only when a place has no extra photos of its own.
const GALLERY_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
  'assets/img/palui1.jpg',
  'assets/img/palui2.jpg',
  'assets/img/palui3.jpg'

];


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ],
})


export class HomePage implements ViewWillEnter {

  // Search box value
  searchTerm = '';

  // Currently selected category
  activeCategory = '';


  // Text shown on the featured destination
  featuredBadge = 'Featured destination';


  // Categories shown in the Home page (the same list the admin form uses)
  categories: Category[] = CATEGORY_OPTIONS;


  // ============================================================
  // DESTINATIONS
  // ============================================================

  // The places come from the shared list the admin manages (see PlacesService).
  // Hidden places are left out. Reading this inside the template keeps it up to date.
  get destinations(): Destination[] {
    return this.places.visiblePlaces;
  }


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private router: Router,
    private state: AppStateService,
    private places: PlacesService,
  ) {

    addIcons({

      'person-circle-outline':
        personCircleOutline,

      'notifications-outline':
        notificationsOutline,

      'search-outline':
        searchOutline,

      heart:
        heart,

      'heart-outline':
        heartOutline,

      star:
        star,

      'arrow-forward':
        arrowForward

    });

  }


  // ============================================================
  // FEATURED DESTINATION
  // ============================================================

  get featured(): Destination | null {
    return this.places.featuredPlace;
  }


  // ============================================================
  // CHECK IF SEARCH OR CATEGORY FILTER IS ACTIVE
  // ============================================================

  get isFiltering(): boolean {

    return (
      !!this.searchTerm.trim() ||
      !!this.activeCategory
    );

  }


  // ============================================================
  // SECTION TITLE
  // ============================================================

  get sectionLabel(): string {

    return this.isFiltering
      ? 'Results'
      : 'Popular this week';

  }


  // ============================================================
  // DESTINATIONS DISPLAYED ON HOME PAGE
  // ============================================================

  get visibleDestinations(): Destination[] {

    // When the user has not searched or selected
    // a category, only show popular destinations.
    if (!this.isFiltering) {

      return this.destinations.filter(
        (destination) => destination.popular
      );

    }


    // Get search text
    const query =
      this.searchTerm
        .trim()
        .toLowerCase();


    // Filter destinations
    return this.destinations.filter(
      (destination) => {

        // Check category
        const matchesCategory =
          !this.activeCategory ||
          destination.categories.includes(
            this.activeCategory
          );


        // Check search text
        const matchesText =
          !query ||
          `${destination.name} ${destination.country}`
            .toLowerCase()
            .includes(query);


        return (
          matchesCategory &&
          matchesText
        );

      }
    );

  }


  // ============================================================
  // PROFILE
  // ============================================================

  onProfile() {

    this.router.navigate([
      '/user-setting'
    ]);

  }


  // ============================================================
  // QUICK ACCESS / NOTIFICATIONS
  // ============================================================

  // Unread notifications shown on the bell. Reads a signal inside the service,
  // so the badge refreshes by itself.
  get unreadNotifications(): number {
    return this.state.unreadNotificationCount;
  }

  onQuickAccess() {
    this.router.navigate(['/notifications']);
  }


  // ============================================================
  // CATEGORY SELECT
  // ============================================================

  onCategorySelect(
    cat: Category
  ) {

    // Clicking the same category again
    // removes the filter.

    this.activeCategory =
      this.activeCategory === cat.id
        ? ''
        : cat.id;

  }


  // ============================================================
  // OPEN DESTINATION DETAILS
  // ============================================================

  openDetails(
    dest: Destination
  ) {

    this.router.navigate(
      ['/destination-details'],
      {
        state: {

          destination: {

            ...dest,

            // The details page expects heroImage.
            heroImage: dest.image,

            // Keep three images for the
            // destination details page.
            // The place's own extra photos come first; the
            // stock photos below only fill any empty spots.
            thumbnails: [
              dest.image,
              ...(dest.gallery ?? []),
              ...GALLERY_PHOTOS
            ]

          }

        }

      }
    );

  }


  // ============================================================
  // FAVORITE BUTTON
  // ============================================================

  // Places saved before copies were kept get their copy the next time Home is shown.
  ionViewWillEnter(): void {
    // Pick up places the admin added or changed since this screen was last open.
    void this.places.refresh();

    for (const dest of this.destinations) {
      if (this.state.isFavorite(dest.id)) {
        this.state.rememberFavorite(dest.id, this.snapshot(dest));
      }
    }
  }

  private snapshot(dest: Destination) {
    return {
      id: dest.id,
      name: dest.name,
      country: dest.country,
      price: dest.price,
      rating: dest.rating,
      reviewCount: dest.reviewCount,
      image: dest.image,
      description: dest.description,
      // only present when a place has its own photo gallery
      gallery: dest.gallery,
    };
  }

  isFavorite(dest: Destination): boolean {
    return this.state.isFavorite(dest.id);
  }

  onToggleFavorite(
    dest: Destination,
    event: Event
  ) {

    // Prevent the destination card from opening
    // when the heart button is clicked.
    event.stopPropagation();


    this.state.toggleFavorite(dest.id, this.snapshot(dest));

  }

}