import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService, PaymentMethodInfo } from '../services/app-state.service';
import { IonContent, IonIcon, NavController, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

interface PaymentMethod {
  id: string;
  label: string;
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class PaymentPage implements OnInit, ViewWillEnter {
  // The app runs without zone.js, so changes made from a lifecycle hook must ask for a refresh.
  private cdr = inject(ChangeDetectorRef);

  // Payment methods saved under Profile > Manage payment methods
  savedMethods: PaymentMethodInfo[] = [];
  // Id of the saved method being used, or '' when typing a different one
  selectedSavedId = '';

  // Booking Data (falls back to placeholders if opened without a booking)
  accommodationName: string = 'Your stay';
  placeId: number | undefined;
  // Total in Philippine peso (₱), shown with the PHP currency pipe
  bookingTotal: number = 0;

  // Payment Form Fields
  discountCode: string = '';
  securityCode: string = '';
  accountNumber: string = '';
  selectedPaymentMethod: string = 'card';

  paymentMethods: PaymentMethod[] = [
    { id: 'ewallet', label: 'E-Wallet' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank' },
  ];

  private checkIn = '';
  private checkOut = '';
  private nights = 0;

  constructor(
    private router: Router,
    private location: Location,
    private appState: AppStateService,
    private nav: NavController,
  ) {
    addIcons({ 'arrow-back-outline': arrowBackOutline });

    // Start with the user's default saved payment method, if they have one.
    this.loadSavedMethods();

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as
      | {
          accommodationName?: string;
          placeId?: number;
          bookingTotal?: number;
          checkIn?: string;
          checkOut?: string;
          nights?: number;
        }
      | undefined;

    if (state?.accommodationName) {
      this.accommodationName = state.accommodationName;
    }
    this.placeId = typeof state?.placeId === 'number' ? state.placeId : undefined;
    if (typeof state?.bookingTotal === 'number') {
      this.bookingTotal = state.bookingTotal;
    }
    this.checkIn = state?.checkIn ?? '';
    this.checkOut = state?.checkOut ?? '';
    this.nights = state?.nights ?? 0;
  }

  ngOnInit() {}

  ionViewWillEnter(): void {
    this.loadSavedMethods();
    this.cdr.markForCheck();
    // Get the latest saved methods from Supabase, then show them.
    void this.appState.refreshPaymentMethods().then(() => {
      this.loadSavedMethods();
      this.cdr.markForCheck();
    });
  }

  get selectedSaved(): PaymentMethodInfo | null {
    return this.savedMethods.find((m) => m.id === this.selectedSavedId) ?? null;
  }

  private loadSavedMethods(): void {
    this.savedMethods = this.appState.paymentMethods;
    if (this.selectedSaved) return;

    const savedDefault = this.appState.defaultPaymentMethod;
    this.selectedSavedId = savedDefault?.id ?? '';
    if (savedDefault) {
      this.selectedPaymentMethod = savedDefault.type;
    }
  }

  // Pay with a saved method: no number to type again (a card still needs its security code).
  onSelectSaved(method: PaymentMethodInfo): void {
    this.selectedSavedId = method.id;
    this.selectedPaymentMethod = method.type;
    this.accountNumber = '';
    this.securityCode = '';
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/booking']);
    }
  }

  get accountNumberLabel(): string {
    if (this.selectedPaymentMethod === 'ewallet') return 'E-Wallet Mobile Number';
    if (this.selectedPaymentMethod === 'bank') return 'Bank Account Number';
    return 'Card Number';
  }

  get accountNumberPlaceholder(): string {
    if (this.selectedPaymentMethod === 'ewallet') return '09xx xxx xxxx';
    if (this.selectedPaymentMethod === 'bank') return '0000 0000 0000';
    return '1234 5678 9012 3456';
  }

  // Set once the payment is submitted, so a double tap cannot create two bookings.
  private paying = false;

  get canContinue(): boolean {
    // Nothing to pay for when the page is opened without a booking.
    if (this.bookingTotal <= 0 || this.nights <= 0) return false;

    // A saved method already has its details; only a card's security code is asked again.
    if (this.selectedSaved) {
      return this.selectedSaved.type === 'card' ? this.securityCode.length >= 3 : true;
    }

    const digits = this.accountNumber.replace(/\D/g, '');
    if (this.selectedPaymentMethod === 'card') {
      return digits.length >= 13 && this.securityCode.length >= 3;
    }
    return digits.length >= 6;
  }

  onAccountNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    if (this.selectedPaymentMethod === 'card') {
      const digits = raw.slice(0, 16);
      this.accountNumber = digits.replace(/(.{4})/g, '$1 ').trim();
    } else {
      this.accountNumber = raw.slice(0, 16);
    }
    input.value = this.accountNumber;
  }

  onSecurityCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.securityCode = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = this.securityCode;
  }

  // Typing a different method instead of a saved one.
  onSelectMethod(id: string): void {
    if (id === this.selectedPaymentMethod && !this.selectedSavedId) return;
    this.selectedSavedId = '';
    this.selectedPaymentMethod = id;
    this.onPaymentMethodChange();
  }

  onPaymentMethodChange(): void {
    // switching methods clears the field so a card number can't be
    // mistaken for a bank/e-wallet number or vice versa
    this.accountNumber = '';
    this.securityCode = '';
  }

  // Shown under the Continue button when the booking could not be saved.
  payError = '';

  async processPayment(): Promise<void> {
    if (!this.canContinue || this.paying) return;
    this.paying = true;
    this.payError = '';

    // TODO: send the payment to a real payment provider. For now the booking is
    // saved in the app so User Settings can show it.
    const saved = this.selectedSaved;
    const method = this.paymentMethods.find((m) => m.id === this.selectedPaymentMethod);
    const methodLabel = saved ? `${saved.label} ••${saved.last4}` : method?.label ?? this.selectedPaymentMethod;
    const booking = await this.appState.addBooking({
      destinationName: this.accommodationName,
      placeId: this.placeId,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      nights: this.nights,
      total: this.bookingTotal,
      method: methodLabel,
    });

    if (!booking) {
      this.paying = false;
      this.payError = this.appState.bookingError || 'Your booking could not be saved. Please try again.';
      this.cdr.markForCheck();
      return;
    }

    // Start a fresh stack at the confirmation screen, so Back cannot return to the payment form.
    this.nav.navigateRoot('/afterpay', { state: { bookingId: booking.id } });
  }
}