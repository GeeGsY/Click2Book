import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonAvatar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonButton
  ]
})
export class PaymentPage implements OnInit {
  // Booking Data (falls back to placeholders if opened without a booking)
  accommodationName: string = 'Your stay';
  bookingTotal: string = '₱0';

  // Payment Form Fields
  discountCode: string = '';
  securityCode: string = '';
  accountNumber: string = '';
  selectedPaymentMethod: string = 'card';

  constructor(private router: Router, private location: Location) {
    addIcons({ 'arrow-back-outline': arrowBackOutline });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as
      | { accommodationName?: string; bookingTotal?: string }
      | undefined;

    if (state?.accommodationName) {
      this.accommodationName = state.accommodationName;
    }
    if (state?.bookingTotal) {
      this.bookingTotal = state.bookingTotal;
    }
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

  onAccountNumberInput(event: CustomEvent): void {
    const raw = ((event.detail as any)?.value ?? '').toString().replace(/\D/g, '');

    if (this.selectedPaymentMethod === 'card') {
      const digits = raw.slice(0, 16);
      this.accountNumber = digits.replace(/(.{4})/g, '$1 ').trim();
    } else {
      this.accountNumber = raw.slice(0, 16);
    }
  }

  onPaymentMethodChange(): void {
    // switching methods clears the field so a card number can't be
    // mistaken for a bank/e-wallet number or vice versa
    this.accountNumber = '';
    this.securityCode = '';
  }

  processPayment() {
    if (!this.canContinue) return;

    // Validate inputs or submit payment logic here
    console.log('Processing payment via:', this.selectedPaymentMethod);
    console.log('Details:', {
      accommodation: this.accommodationName,
      total: this.bookingTotal,
      discount: this.discountCode,
      method: this.selectedPaymentMethod
    });

    // Navigate to confirmation screen
    this.router.navigate(['/booking-confirmation']);
  }
}