import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

interface CalendarCell {
  date: Date;
  day: number;
  iso: string;
  inCurrentMonth: boolean;
}

// Used when the page is opened without a destination (price per night, in ₱).
const DEFAULT_NIGHTLY_RATE = 10000;

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule],
})
export class BookingPage implements OnInit, ViewWillEnter {
  // Nightly rate in Philippine peso (₱), taken from the chosen destination
  nightlyRate = DEFAULT_NIGHTLY_RATE;

  destinationName = 'Your stay';
  private destination: any = null;

  checkIn = this.toDateInputValue(this.addDays(new Date(), 3));
  checkOut = this.toDateInputValue(this.addDays(new Date(), 8));

  viewYear = 0;
  viewMonth = 0; // 0-11
  calendarCells: CalendarCell[] = [];

  constructor(private router: Router) {
    addIcons({ 'arrow-back-outline': arrowBackOutline });
    // The router's navigation state is only available while the page is being created.
    this.loadDestinationFromState();
  }

  ngOnInit(): void {
    const start = new Date(this.checkIn);
    this.viewYear = start.getFullYear();
    this.viewMonth = start.getMonth();
    this.rebuildCalendar();
  }

  // Ionic reuses this page between visits, so re-read the chosen destination
  // every time it becomes active again.
  ionViewWillEnter(): void {
    this.loadDestinationFromState();
  }

  private loadDestinationFromState(): void {
    const navState = (this.router.getCurrentNavigation()?.extras?.state ?? history.state ?? {}) as {
      destination?: any;
    };
    const incoming = navState.destination;

    if (incoming?.name) {
      this.destination = incoming;
      this.destinationName = incoming.country ? `${incoming.name}, ${incoming.country}` : incoming.name;
      this.nightlyRate = typeof incoming.price === 'number' ? incoming.price : DEFAULT_NIGHTLY_RATE;
    }
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(this.viewYear, this.viewMonth, 1)
    );
  }

  get nights(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    const inDate = new Date(this.checkIn);
    const outDate = new Date(this.checkOut);
    const diff = outDate.getTime() - inDate.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  get totalCost(): number {
    return this.nights > 0 ? this.nightlyRate * this.nights : 0;
  }

  get staySummary(): string {
    if (this.nights === 0) return 'Select checkout date';
    return `${this.nights} night${this.nights > 1 ? 's' : ''}`;
  }

  prevMonth(): void {
    this.viewMonth -= 1;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    }
    this.rebuildCalendar();
  }

  nextMonth(): void {
    this.viewMonth += 1;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    }
    this.rebuildCalendar();
  }

  onDayClick(cell: CalendarCell): void {
    if (!cell.inCurrentMonth) {
      // let the user tap a greyed-out day to jump the view to that month
      this.viewYear = cell.date.getFullYear();
      this.viewMonth = cell.date.getMonth();
    }

    const clickedIso = cell.iso;
    const hasFullRange = !!this.checkIn && !!this.checkOut;

    if (!this.checkIn || hasFullRange) {
      // start a fresh selection
      this.checkIn = clickedIso;
      this.checkOut = '';
    } else if (clickedIso < this.checkIn) {
      // tapped before the current check-in: it becomes the new start
      this.checkIn = clickedIso;
      this.checkOut = '';
    } else if (clickedIso === this.checkIn) {
      // tapped the same day again: keep waiting for a checkout
      this.checkOut = '';
    } else {
      // tapped after check-in: complete the range
      this.checkOut = clickedIso;
    }

    this.rebuildCalendar();
  }

  onCheckInChange(): void {
    if (this.checkOut && this.checkOut < this.checkIn) {
      this.checkOut = '';
    }
    const d = new Date(this.checkIn);
    this.viewYear = d.getFullYear();
    this.viewMonth = d.getMonth();
    this.rebuildCalendar();
  }

  onCheckOutChange(): void {
    if (this.checkOut && this.checkOut < this.checkIn) {
      // user picked an earlier date in the checkout field: swap them
      [this.checkIn, this.checkOut] = [this.checkOut, this.checkIn];
    }
    this.rebuildCalendar();
  }

  dayClass(cell: CalendarCell): string {
    const classes = ['day'];
    if (!cell.inCurrentMonth) classes.push('muted');
    if (cell.iso === this.checkIn || cell.iso === this.checkOut) classes.push('selected');
    if (this.checkIn && this.checkOut && cell.iso > this.checkIn && cell.iso < this.checkOut) {
      classes.push('selected-range');
    }
    return classes.join(' ');
  }

  formatDate(dateValue: string): string {
    if (!dateValue) return 'Select date';
    const date = new Date(dateValue);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  proceedToPayment(): void {
    if (this.nights === 0) return;
    this.router.navigate(['/payment'], {
      state: {
        accommodationName: this.destinationName,
        bookingTotal: this.totalCost,
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/destination-details'], {
      state: this.destination ? { destination: this.destination } : undefined,
    });
  }

  private rebuildCalendar(): void {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const gridStart = this.addDays(firstOfMonth, -startOffset);

    this.calendarCells = Array.from({ length: 42 }, (_, i) => {
      const date = this.addDays(gridStart, i);
      return {
        date,
        day: date.getDate(),
        iso: this.toDateInputValue(date),
        inCurrentMonth: date.getMonth() === this.viewMonth,
      };
    });
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}