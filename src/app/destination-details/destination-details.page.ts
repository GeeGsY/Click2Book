import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chatbubbleEllipsesOutline,
  star,
  locationOutline,
  wifiOutline,
  waterOutline,
  restaurantOutline,
  snowOutline,
} from 'ionicons/icons';

interface Amenity {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_DESTINATION = {
  name: 'Bali',
  country: 'Indonesia',
  rating: 4.6,
  reviewCount: 4218,
  price: '₱18,500',
  heroImage:
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80',
  thumbnails: [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=300&q=80',
    'https://images.unsplash.com/photo-1573790387438-4da905039392?w=300&q=80',
    'https://images.unsplash.com/photo-1518544866330-4d5c4c4b4a5b?w=300&q=80',
  ],
  description:
    "A cliffside retreat overlooking the Indian Ocean, a short walk from Uluwatu's surf breaks. The stay includes a private pool villa, daily breakfast, and airport transfer. Check-in is from 2:00 PM and check-out is 11:00 AM; early check-in is subject to availability. Free cancellation up to 48 hours before arrival, after which one night is charged.",
};

@Component({
  selector: 'app-destination-details',
  templateUrl: './destination-details.page.html',
  styleUrls: ['./destination-details.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule],
})
export class DestinationDetailsPage implements OnInit, ViewWillEnter {
  destination: any = this.cloneDefault();

  amenities: Amenity[] = [
    { id: 'wifi', label: 'Free Wi-Fi', icon: 'wifi-outline' },
    { id: 'pool', label: 'Private pool', icon: 'water-outline' },
    { id: 'breakfast', label: 'Breakfast', icon: 'restaurant-outline' },
    { id: 'ac', label: 'Air-conditioned', icon: 'snow-outline' },
  ];

  activeImage = 0;

  constructor(private router: Router) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      star: star,
      'location-outline': locationOutline,
      'wifi-outline': wifiOutline,
      'water-outline': waterOutline,
      'restaurant-outline': restaurantOutline,
      'snow-outline': snowOutline,
    });
  }

  ngOnInit() {
    this.loadDestinationFromState();
  }

  // Ionic calls this every time the page becomes active again, even if
  // Angular reused the same component instance for the route. Reading
  // getCurrentNavigation() only in the constructor meant a second
  // destination clicked from the list never replaced the first one.
  ionViewWillEnter(): void {
    this.loadDestinationFromState();
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onMessage() {
    // TODO: open the conversation with the accommodation/service provider
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
    // previously viewed destination (e.g. its thumbnails) can't leak in.
    this.destination =
      incoming && typeof incoming === 'object' && 'name' in incoming
        ? { ...this.cloneDefault(), ...incoming }
        : this.cloneDefault();

    this.activeImage = 0;
  }

  private cloneDefault() {
    return {
      ...DEFAULT_DESTINATION,
      thumbnails: [...DEFAULT_DESTINATION.thumbnails],
    };
  }
}