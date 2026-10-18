import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { AppStateService } from '../services/app-state.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  createOutline,
  calendarOutline,
  checkmarkDoneOutline,
  heartOutline,
  personOutline,
  lockClosedOutline,
  cardOutline,
  receiptOutline,
  notificationsOutline,
  helpCircleOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  chevronForward,
} from 'ionicons/icons';

interface SummaryTile {
  id: string;
  label: string;
  value: number;
  icon: string;
}

interface SettingRow {
  id: string;
  label: string;
  icon: string;
  meta?: string;
}

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.page.html',
  styleUrls: ['./user-setting.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class UserSettingPage implements ViewWillEnter {
  // The app runs without zone.js, so changes made after an await or from a
  // lifecycle hook must ask Angular to refresh the view.
  private cdr = inject(ChangeDetectorRef);

  // Live data from the logged-in account (see AppStateService), refreshed every time
  // the page is shown so new bookings and saved destinations appear straight away.
  user = { name: '', email: '' };

  // Total spent on bookings, in Philippine peso (₱), shown with the PHP currency pipe.
  totalSpent = 0;

  tiles: SummaryTile[] = [];

  // Short summaries shown on the right of some rows.
  meta: Record<string, string> = {};

  // Settings panel, grouped as in the wireframe (3 + 3 + privacy/logout).
  groups: SettingRow[][] = [
    [
      { id: 'personal', label: 'Edit personal information', icon: 'person-outline' },
      { id: 'password', label: 'Change password', icon: 'lock-closed-outline' },
      { id: 'payment', label: 'Manage payment methods', icon: 'card-outline' },
    ],
    [
      { id: 'history', label: 'Booking history', icon: 'receipt-outline' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
      { id: 'help', label: 'Help and support', icon: 'help-circle-outline' },
    ],
  ];

  privacyRow: SettingRow = {
    id: 'privacy',
    label: 'Privacy information',
    icon: 'shield-checkmark-outline',
  };

  constructor(
    private router: Router,
    private location: Location,
    private appState: AppStateService,
  ) {
    this.refresh();
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'create-outline': createOutline,
      'calendar-outline': calendarOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'heart-outline': heartOutline,
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'card-outline': cardOutline,
      'receipt-outline': receiptOutline,
      'notifications-outline': notificationsOutline,
      'help-circle-outline': helpCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'log-out-outline': logOutOutline,
      'chevron-forward': chevronForward,
    });
  }

  ionViewWillEnter(): void {
    this.refresh();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    const account = this.appState.user;
    this.user = account ?? { name: 'Guest', email: 'Not logged in' };
    this.totalSpent = this.appState.totalSpent;
    const defaultMethod = this.appState.defaultPaymentMethod;
    const unread = this.appState.unreadNotificationCount;
    this.meta = {
      payment: defaultMethod ? defaultMethod.label : '',
      notifications: unread > 0 ? `${unread} new` : '',
    };
    this.tiles = [
      { id: 'upcoming', label: 'Upcoming bookings', value: this.appState.upcomingCount, icon: 'calendar-outline' },
      { id: 'completed', label: 'Completed trips', value: this.appState.completedCount, icon: 'checkmark-done-outline' },
      { id: 'saved', label: 'Saved destinations', value: this.appState.favoritesCount, icon: 'heart-outline' },
    ];
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  onEditProfile() {
    this.router.navigate(['/edit-profile']);
  }

  onTileTap(tile: SummaryTile) {
    if (tile.id === 'saved') {
      this.router.navigate(['/saved']);
    } else {
      // upcoming and completed open the booking history on that filter
      this.router.navigate(['/bookings'], { state: { filter: tile.id } });
    }
  }

  // Each row opens its own screen.
  private readonly routes: Record<string, string> = {
    personal: '/edit-profile',
    password: '/change-password',
    payment: '/payment-methods',
    history: '/bookings',
    notifications: '/notifications',
    help: '/help',
    privacy: '/privacy',
  };

  onRowTap(row: SettingRow) {
    const route = this.routes[row.id];
    if (route) {
      this.router.navigate([route]);
    }
  }

  onLogout() {
    this.appState.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}