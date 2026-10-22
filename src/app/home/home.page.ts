import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { PlacesService } from '../services/places.service';
import { CATEGORY_OPTIONS } from '../data/place.model';
import { IonContent, IonIcon, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
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


export class HomePage implements ViewWillEnter, ViewWillLeave, OnDestroy {

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

  // Every featured place; Home slides through them like a carousel.
  get featuredList(): Destination[] {
    return this.places.featuredPlaces;
  }

  trackByPlace(_: number, place: Destination): number {
    return place.id;
  }

  // The slide that is showing now (drives the dots).
  slideIndex = signal(0);

  @ViewChild('featuredTrack') private featuredTrack?: ElementRef<HTMLElement>;

  private slideTimer?: ReturnType<typeof setInterval>;
  private resumeTimer?: ReturnType<typeof setTimeout>;

  // Moves to the next featured place every few seconds (not when the person prefers less motion).
  startSlides(): void {
    this.stopSlides();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    this.slideTimer = setInterval(() => {
      const count = this.featuredList.length;
      if (count > 1) {
        this.goToSlide((this.slideIndex() + 1) % count);
      }
    }, 5000);
  }

  stopSlides(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.slideTimer = undefined;
    this.resumeTimer = undefined;
  }

  // While a finger or the mouse is on the carousel it stops sliding by itself.
  pauseSlides(): void {
    this.stopSlides();
  }

  resumeSlides(): void {
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => this.startSlides(), 3000);
  }

  // While the carousel scrolls by itself, the scroll events must not move the dots back and forth.
  private ignoreScrollUntil = 0;

  goToSlide(index: number): void {
    const track = this.featuredTrack?.nativeElement;
    this.slideIndex.set(index);
    this.ignoreScrollUntil = Date.now() + 700;
    track?.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  }

  // Back to the first featured place (for example after the admin changed the list).
  private resetSlides(): void {
    this.slideIndex.set(0);
    const track = this.featuredTrack?.nativeElement;
    if (track) track.scrollLeft = 0;
  }

  // Keeps the dots in step when the person swipes.
  onTrackScroll(): void {
    if (Date.now() < this.ignoreScrollUntil) return;
    const track = this.featuredTrack?.nativeElement;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== this.slideIndex()) this.slideIndex.set(index);
  }

  ionViewWillLeave(): void {
    this.stopSlides();
  }

  ngOnDestroy(): void {
    this.stopSlides();
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
    this.resetSlides();
    this.startSlides();

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