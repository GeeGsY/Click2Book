import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { IonContent, IonIcon } from '@ionic/angular';
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
export class PaymentPage implements OnInit {
  // Booking Data (falls back to placeholders if opened without a booking)
  accommodationName: string = 'Your stay';
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
  ) {
    addIcons({ 'arrow-back-outline': arrowBackOutline });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as
      | {
          accommodationName?: string;
          bookingTotal?: number;
          checkIn?: string;
          checkOut?: string;
          nights?: number;
        }
      | undefined;

    if (state?.accommodationName) {
      this.accommodationName = state.accommodationName;
    }
    if (typeof state?.bookingTotal === 'number') {
      this.bookingTotal = state.bookingTotal;
    }
    this.checkIn = state?.checkIn ?? '';
    this.checkOut = state?.checkOut ?? '';
    this.nights = state?.nights ?? 0;
  }

  ngOnInit() {}

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

  get canContinue(): boolean {
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

  onSelectMethod(id: string): void {
    if (id === this.selectedPaymentMethod) return;
    this.selectedPaymentMethod = id;
    this.onPaymentMethodChange();
  }

  onPaymentMethodChange(): void {
    // switching methods clears the field so a card number can't be
    // mistaken for a bank/e-wallet number or vice versa
    this.accountNumber = '';
    this.securityCode = '';
  }

  processPayment() {
    if (!this.canContinue) return;

    // TODO: send the payment to a real payment provider. For now the booking is
    // saved in the app so User Settings can show it.
    const method = this.paymentMethods.find((m) => m.id === this.selectedPaymentMethod);
    this.appState.addBooking({
      destinationName: this.accommodationName,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      nights: this.nights,
      total: this.bookingTotal,
      method: method?.label ?? this.selectedPaymentMethod,
    });

    // Navigate to confirmation screen
    this.router.navigate(['/afterpay']);
  }
}