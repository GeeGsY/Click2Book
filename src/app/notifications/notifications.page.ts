import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  chatbubbleEllipsesOutline,
  sparklesOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { AppNotification, AppStateService } from '../services/app-state.service';
import { timeAgo } from '../utils/time';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class NotificationsPage implements ViewWillEnter {
  private router = inject(Router);
  private location = inject(Location);
  private appState = inject(AppStateService);

  // A signal, because the app runs without zone.js.
  items = signal<AppNotification[]>([]);

  constructor() {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      'sparkles-outline': sparklesOutline,
      'notifications-outline': notificationsOutline,
    });
    this.refresh();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  get hasUnread(): boolean {
    return this.items().some((n) => !n.read);
  }

  trackById(_: number, item: AppNotification): string {
    return item.id;
  }

  iconFor(item: AppNotification): string {
    switch (item.type) {
      case 'booking':
        return 'checkmark-circle-outline';
      case 'message':
        return 'chatbubble-ellipses-outline';
      default:
        return 'sparkles-outline';
    }
  }

  when(item: AppNotification): string {
    return timeAgo(item.createdAt);
  }

  open(item: AppNotification): void {
    this.appState.markNotificationRead(item.id);
    this.refresh();

    // A message notification opens that conversation.
    if (item.type === 'message' && item.thread) {
      this.router.navigate(['/chat'], { state: { destinationName: item.thread } });
    }
  }

  markAllRead(): void {
    this.appState.markAllNotificationsRead();
    this.refresh();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  private refresh(): void {
    this.items.set(this.appState.notifications);
    // Get the latest notifications from Supabase, then show them.
    void this.appState.refreshInbox().then(() => this.items.set(this.appState.notifications));
  }
}