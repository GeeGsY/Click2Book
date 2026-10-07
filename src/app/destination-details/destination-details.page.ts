import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chatbubbleEllipsesOutline, star } from 'ionicons/icons';

// Sample destination shown if the page is opened without picking one from Home.
// Price is per night in Philippine peso (₱).
const DEFAULT_DESTINATION = {
  name: 'Bali',
  country: 'Indonesia',
  rating: 4.6,
  reviewCount: 4218,
  price: 18500,
  heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80',
  thumbnails: [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=300&q=80',
    'https://images.unsplash.com/photo-1573790387438-4da905039392?w=300&q=80',
  ],
  description:
    "A cliffside retreat overlooking the Indian Ocean, a short walk from Uluwatu's surf breaks. The stay includes a private pool villa, daily breakfast, and airport transfer. Check-in is from 2:00 PM and check-out is 11:00 AM; early check-in is subject to availability. Free cancellation up to 48 hours before arrival, after which one night is charged.",
};

@Component({
  selector: 'app-destination-details',
  templateUrl: './destination-details.page.html',
  styleUrls: ['./destination-details.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule],
})
export class DestinationDetailsPage implements OnInit, ViewWillEnter {
  destination: any = this.cloneDefault();
  activeImage = 0;

  constructor(private router: Router) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      star: star,
    });
  }

  ngOnInit() {
    this.loadDestinationFromState();
  }

  // Ionic calls this every time the page becomes active again, even if
  // Angular reused the same component instance for the route, so a second
  // destination picked from Home replaces the first one.
  ionViewWillEnter(): void {
    this.loadDestinationFromState();
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onMessage() {
    this.router.navigate(['/message']);
  }

  onSelectThumbnail(index: number) {
    this.activeImage = index;
    if (this.destination.thumbnails && this.destination.thumbnails[index]) {
      this.destination.heroImage = this.destination.thumbnails[index];
    }
  }

  onBookNow() {
    this.router.navigate(['/booking'], {
      state: { destination: this.destination },
    });
  }

  private loadDestinationFromState(): void {
    const navState = (history.state ?? {}) as { destination?: Record<string, unknown> };
    const incoming = navState.destination;

    // Always rebuild from the clean default so leftover fields from a
    // previously viewed destination can't leak in.
    this.destination =
      incoming && typeof incoming === 'object' && 'name' in incoming
        ? { ...this.cloneDefault(), ...incoming }
        : this.cloneDefault();

    // Keep exactly three previews, as in the wireframe.
    this.destination.thumbnails = (this.destination.thumbnails ?? []).slice(0, 3);
    this.activeImage = 0;
  }

  private cloneDefault() {
    return {
      ...DEFAULT_DESTINATION,
      thumbnails: [...DEFAULT_DESTINATION.thumbnails],
    };
  }
}