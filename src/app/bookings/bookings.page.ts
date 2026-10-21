import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, receiptOutline, downloadOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
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

  visible = computed(() =>
    this.all().filter((b) => this.filter() === 'all' || this.statusOf(b) === this.filter()),
  );

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'receipt-outline': receiptOutline,
      'download-outline': downloadOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
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
    this.refresh();
    // Get the latest bookings from Supabase, then show them.
    void this.appState.refreshBookings().then(() => this.refresh());
  }

  private refresh(): void {
    // Newest booking first
    this.all.set([...this.appState.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    this.totalSpent.set(this.appState.totalSpent);
    this.confirmCancelId.set(null);
  }
}