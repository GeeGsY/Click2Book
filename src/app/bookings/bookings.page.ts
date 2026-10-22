import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  receiptOutline,
  downloadOutline,
  chatbubbleEllipsesOutline,
  star,
  starOutline,
} from 'ionicons/icons';
import { ReviewsService } from '../services/reviews.service';
import { AppStateService, Booking, BookingStatus } from '../services/app-state.service';
import { buildReceiptPdf, downloadBlob } from '../utils/receipt';

type Filter = 'all' | BookingStatus;

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class BookingsPage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);
  private reviews = inject(ReviewsService);

  readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  // Signals, because the app runs without zone.js.
  all = signal<Booking[]>([]);
  filter = signal<Filter>('all');
  message = signal('');
  confirmCancelId = signal<string | null>(null);
  totalSpent = signal(0);

  // Reviews: which stays are already reviewed, and the review being written.
  readonly stars = [1, 2, 3, 4, 5];
  reviewedIds = signal<Set<string>>(new Set());
  reviewingId = signal<string | null>(null);
  reviewRating = signal(0);
  reviewText = signal('');
  reviewBusy = signal(false);
  thanks = signal('');

  visible = computed(() =>
    this.all().filter((b) => this.filter() === 'all' || this.statusOf(b) === this.filter()),
  );

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'receipt-outline': receiptOutline,
      'download-outline': downloadOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      star: star,
      'star-outline': starOutline,
    });
    this.load(this.router.getCurrentNavigation()?.extras?.state);
  }

  ionViewWillEnter(): void {
    this.load(history.state);
  }

  trackById(_: number, booking: Booking): string {
    return booking.id;
  }

  statusOf(booking: Booking): BookingStatus {
    return this.appState.statusOf(booking);
  }

  statusLabel(booking: Booking): string {
    const status = this.statusOf(booking);
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  canCancel(booking: Booking): boolean {
    return this.appState.canCancel(booking);
  }

  // A finished stay that was not reviewed yet.
  canReview(booking: Booking): boolean {
    return (
      this.statusOf(booking) === 'completed' &&
      booking.status !== 'cancelled' &&
      booking.placeId !== undefined &&
      !this.reviewedIds().has(booking.id)
    );
  }

  isReviewed(booking: Booking): boolean {
    return this.reviewedIds().has(booking.id);
  }

  openReview(booking: Booking): void {
    this.message.set('');
    this.thanks.set('');
    this.reviewRating.set(0);
    this.reviewText.set('');
    this.reviewingId.set(booking.id);
  }

  closeReview(): void {
    this.reviewingId.set(null);
  }

  onReviewInput(event: Event): void {
    this.reviewText.set((event.target as HTMLTextAreaElement).value);
  }

  async submitReview(booking: Booking): Promise<void> {
    if (this.reviewBusy()) return;
    if (this.reviewRating() < 1) {
      this.message.set('Choose 1 to 5 stars first.');
      return;
    }

    this.message.set('');
    this.reviewBusy.set(true);
    const result = await this.reviews.submit(booking.id, this.reviewRating(), this.reviewText());
    this.reviewBusy.set(false);

    if (!result.ok) {
      this.message.set(result.error ?? 'Could not save your review.');
      return;
    }
    this.reviewedIds.update((ids) => new Set(ids).add(booking.id));
    this.reviewingId.set(null);
    this.thanks.set('Thanks! Your review was saved.');
  }

  count(filter: Filter): number {
    return filter === 'all' ? this.all().length : this.all().filter((b) => this.statusOf(b) === filter).length;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  // Two taps: Cancel booking, then Yes.
  async cancel(booking: Booking): Promise<void> {
    this.message.set('');
    if (this.confirmCancelId() !== booking.id) {
      this.confirmCancelId.set(booking.id);
      return;
    }

    const result = await this.appState.cancelBooking(booking.id);
    this.confirmCancelId.set(null);
    if (!result.ok) {
      this.message.set(result.error ?? 'Could not cancel this booking.');
    }
    this.refresh();
  }

  downloadReceipt(booking: Booking): void {
    const guest = this.appState.user;
    const pdf = buildReceiptPdf({
      reference: booking.id,
      stay: booking.destinationName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guestName: guest?.name ?? 'Guest',
      guestEmail: guest?.email ?? '',
      method: booking.method,
      total: booking.total,
      status: this.statusLabel(booking),
      issuedAt: new Date(),
    });
    downloadBlob(pdf, `Click2Book-receipt-${booking.id}.pdf`);
  }

  messageHost(booking: Booking): void {
    this.router.navigate(['/chat'], { state: { destinationName: booking.destinationName } });
  }

  private load(navState: unknown): void {
    const { filter } = (navState ?? {}) as { filter?: Filter };
    this.filter.set(this.filters.some((f) => f.id === filter) ? (filter as Filter) : 'all');
    this.message.set('');
    this.thanks.set('');
    this.refresh();
    // Get the latest bookings from Supabase, then show them.
    void this.appState.refreshBookings().then(() => this.refresh());
    void this.reviews.myReviewedBookingIds().then((ids) => this.reviewedIds.set(ids));
  }

  private refresh(): void {
    // Newest booking first
    this.all.set([...this.appState.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    this.totalSpent.set(this.appState.totalSpent);
    this.confirmCancelId.set(null);
  }
}