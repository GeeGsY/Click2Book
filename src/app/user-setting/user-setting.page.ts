import { Component } from '@angular/core';
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
  // Live data from the logged-in account (see AppStateService), refreshed every time
  // the page is shown so new bookings and saved destinations appear straight away.
  user = { name: '', email: '' };

  // Total spent on bookings, in Philippine peso (₱), shown with the PHP currency pipe.
  totalSpent = 0;

  tiles: SummaryTile[] = [];

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
  }

  private refresh(): void {
    const account = this.appState.user;
    this.user = account ?? { name: 'Guest', email: 'Not logged in' };
    this.totalSpent = this.appState.totalSpent;
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
    // TODO: open the edit-profile form (name, email, photo)
  }

  onTileTap(tile: SummaryTile) {
    // TODO: open the matching list (upcoming bookings, completed trips, saved destinations)
  }

  onRowTap(row: SettingRow) {
    // TODO: connect each setting to its own screen. Intended function per row:
    //  personal      -> edit name, email, phone
    //  password      -> change password
    //  payment       -> saved e-wallet / card / bank details
    //  history       -> past and upcoming reservations
    //  notifications -> booking and message alerts
    //  help          -> FAQs and contact support
    //  privacy       -> privacy policy and data information
  }

  onLogout() {
    this.appState.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}