import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, NavController, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeOutline, downloadOutline } from 'ionicons/icons';
import { AppStateService, Booking } from '../services/app-state.service';
import { buildReceiptPdf, downloadBlob } from '../utils/receipt';

@Component({
  selector: 'app-afterpay',
  templateUrl: './afterpay.page.html',
  styleUrls: ['./afterpay.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AfterpayPage implements ViewWillEnter {
  private router = inject(Router);
  private nav = inject(NavController);
  private appState = inject(AppStateService);

  // Signals, because the app runs without zone.js.
  booking = signal<Booking | null>(null);
  guest = signal<{ name: string; email: string } | null>(null);

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'close-outline': closeOutline,
      'download-outline': downloadOutline,
    });
    this.load(this.router.getCurrentNavigation()?.extras?.state);
  }

  ionViewWillEnter(): void {
    this.load(history.state);
    // If the page was reopened (or the app reloaded), fetch the bookings again and re-check.
    if (!this.booking()) {
      void this.appState.refreshBookings().then(() => this.load(history.state));
    }
  }

  goHome(): void {
    this.nav.navigateRoot('/home');
  }

  // Saves a PDF receipt for this booking.
  downloadReceipt(): void {
    const booking = this.booking();
    if (!booking) return;

    const guest = this.guest();
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
      issuedAt: new Date(),
    });
    downloadBlob(pdf, `Click2Book-receipt-${booking.id}.pdf`);
  }

  // Opens the conversation with the host of this stay, with the confirmation note.
  messageHost(): void {
    const booking = this.booking();
    if (!booking) return;

    this.router.navigate(['/chat'], {
      state: { destinationName: booking.destinationName, afterPayment: true },
    });
  }

  private load(navState: unknown): void {
    const { bookingId } = (navState ?? {}) as { bookingId?: string };

    // The booking that was just paid; if the page is reopened, show the latest one.
    const booking =
      (bookingId ? this.appState.getBooking(bookingId) : null) ?? this.appState.latestBooking;

    if (!booking) {
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    this.booking.set(booking);
    this.guest.set(this.appState.user);
  }
}