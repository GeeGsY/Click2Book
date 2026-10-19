import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, receiptOutline } from 'ionicons/icons';
import { AdminBooking, AppStateService, BookingStatus } from '../services/app-state.service';

type Filter = 'all' | BookingStatus;

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.page.html',
  styleUrls: ['./admin-bookings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AdminBookingsPage {
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
  filter = signal<Filter>('all');
  message = signal('');
  // "<action>:<booking id>" while waiting for the second tap
  confirming = signal<string | null>(null);

  constructor() {
    addIcons({ 'arrow-back-outline': arrowBackOutline, 'receipt-outline': receiptOutline });
  }

  // Reads a signal inside the service, so the list refreshes by itself.
  get all(): AdminBooking[] {
    return this.appState.allBookings;
  }

  get visible(): AdminBooking[] {
    return this.all.filter((x) => this.filter() === 'all' || this.statusOf(x) === this.filter());
  }

  trackById(_: number, item: AdminBooking): string {
    return item.booking.id;
  }

  statusOf(item: AdminBooking): BookingStatus {
    return this.appState.statusOf(item.booking);
  }

  statusLabel(item: AdminBooking): string {
    const status = this.statusOf(item);
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  count(filter: Filter): number {
    return filter === 'all' ? this.all.length : this.all.filter((x) => this.statusOf(x) === filter).length;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin']);
    }
  }

  // Two taps: the action, then Yes.
  act(item: AdminBooking, action: 'completed' | 'cancelled'): void {
    this.message.set('');
    const key = `${action}:${item.booking.id}`;
    if (this.confirming() !== key) {
      this.confirming.set(key);
      return;
    }

    const result = this.appState.adminUpdateBooking(item.guestEmail, item.booking.id, action);
    this.confirming.set(null);
    if (!result.ok) {
      this.message.set(result.error ?? 'Could not update this booking.');
    }
  }
}