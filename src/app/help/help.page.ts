import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronDown, chatbubblesOutline } from 'ionicons/icons';

interface Faq {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class HelpPage {
  private router = inject(Router);
  private location = inject(Location);

  readonly faqs: Faq[] = [
    {
      question: 'How do I book a stay?',
      answer:
        'Open a place from Home and tap Book now. Pick your check-in and check-out dates, tap Continue, choose a payment method and tap Continue again. You will get a confirmation with a booking reference.',
    },
    {
      question: 'Can I cancel a booking?',
      answer:
        'Yes. Open Booking history and tap Cancel booking on an upcoming booking. Cancellation is free until 48 hours before check-in (2:00 PM). After that the cancel button is no longer available.',
    },
    {
      question: 'How do I pay?',
      answer:
        'Choose E-Wallet, Card or Bank on the payment screen. Save your usual methods under Manage payment methods and your default one is selected for you. This prototype does not make real payments.',
    },
    {
      question: 'How do I contact a host?',
      answer:
        'Tap the message icon on a place\'s page, or open the Messages tab to see all your chats. Replies in this prototype are automatic.',
    },
    {
      question: 'Where can I find my receipt?',
      answer:
        'Open Booking history and tap Receipt on any booking, or tap Download receipt on the confirmation screen right after you pay. It is saved as a PDF.',
    },
    {
      question: 'How do I save a place for later?',
      answer:
        'Tap the heart on a place\'s card. Your saved places are listed under Saved destinations in your profile.',
    },
    {
      question: 'I forgot my password.',
      answer:
        'Password recovery is not available in this prototype yet. While you are logged in, you can change your password any time under Change password.',
    },
  ];

  // Signal, because the app runs without zone.js. -1 means every answer is closed.
  openIndex = signal(-1);

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'chevron-down': chevronDown,
      'chatbubbles-outline': chatbubblesOutline,
    });
  }

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? -1 : index);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user-setting']);
    }
  }

  chatWithSupport(): void {
    this.router.navigate(['/chat'], { state: { destinationName: 'Click2Book Support' } });
  }
}