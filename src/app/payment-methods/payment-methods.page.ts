import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, walletOutline, cardOutline, businessOutline, addOutline } from 'ionicons/icons';
import { AppStateService, PaymentMethodInfo } from '../services/app-state.service';

type MethodType = PaymentMethodInfo['type'];

@Component({
  selector: 'app-payment-methods',
  templateUrl: './payment-methods.page.html',
  styleUrls: ['./payment-methods.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class PaymentMethodsPage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  readonly types: { id: MethodType; label: string }[] = [
    { id: 'ewallet', label: 'E-Wallet' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank' },
  ];

  // Signals, because the app runs without zone.js.
  methods = signal<PaymentMethodInfo[]>([]);
  adding = signal(false);
  formType = signal<MethodType>('ewallet');
  message = signal('');
  confirmRemoveId = signal<string | null>(null);

  label = '';
  number = '';

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'wallet-outline': walletOutline,
      'card-outline': cardOutline,
      'business-outline': businessOutline,
      'add-outline': addOutline,
    });
    this.refresh();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  trackById(_: number, method: PaymentMethodInfo): string {
    return method.id;
  }

  iconFor(type: MethodType): string {
    return { ewallet: 'wallet-outline', card: 'card-outline', bank: 'business-outline' }[type];
  }

  typeName(type: MethodType): string {
    return this.types.find((t) => t.id === type)?.label ?? type;
  }

  labelPlaceholder(): string {
    return { ewallet: 'GCash', card: 'BPI Visa', bank: 'BDO savings' }[this.formType()];
  }

  numberLabel(): string {
    return { ewallet: 'Mobile number', card: 'Card number', bank: 'Account number' }[this.formType()];
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  startAdding(): void {
    this.label = '';
    this.number = '';
    this.message.set('');
    this.formType.set('ewallet');
    this.adding.set(true);
  }

  cancelAdding(): void {
    this.adding.set(false);
    this.message.set('');
  }

  add(): void {
    const result = this.appState.addPaymentMethod(this.formType(), this.label, this.number);
    if (result.ok) {
      this.label = '';
      this.number = ''; // the full number is never kept
      this.adding.set(false);
      this.message.set('');
      this.refresh();
    } else {
      this.message.set(result.error ?? 'Could not save this payment method.');
    }
  }

  makeDefault(method: PaymentMethodInfo): void {
    this.appState.setDefaultPaymentMethod(method.id);
    this.refresh();
  }

  // Two taps: Remove, then Yes.
  remove(method: PaymentMethodInfo): void {
    if (this.confirmRemoveId() !== method.id) {
      this.confirmRemoveId.set(method.id);
      return;
    }
    this.appState.removePaymentMethod(method.id);
    this.confirmRemoveId.set(null);
    this.refresh();
  }

  private refresh(): void {
    this.methods.set(this.appState.paymentMethods);
    this.confirmRemoveId.set(null);
  }
}