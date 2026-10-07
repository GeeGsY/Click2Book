import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
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
export class UserSettingPage {
  // Sample account data for the skeleton prototype.
  user = {
    name: 'Leo',
    email: 'leo@example.com',
  };

  // Lifetime booking spend in Philippine peso (shown with the PHP currency pipe).
  totalSpent = 41800;

  // Quick summaries / shortcuts: upcoming bookings, completed trips, saved destinations.
  tiles: SummaryTile[] = [
    { id: 'upcoming', label: 'Upcoming bookings', value: 2, icon: 'calendar-outline' },
    { id: 'completed', label: 'Completed trips', value: 5, icon: 'checkmark-done-outline' },
    { id: 'saved', label: 'Saved destinations', value: 8, icon: 'heart-outline' },
  ];

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

  constructor(private router: Router) {
    addIcons({
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
    this.router.navigate(['/login']);
  }
}