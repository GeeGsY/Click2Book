import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  notificationsOutline,
  searchOutline,
  heart,
  heartOutline,
  star,
  arrowForward,
} from 'ionicons/icons';

interface Category {
  id: string;
  label: string;
}

interface Destination {
  id: number;
  name: string;
  country: string;
  // Price per night in Philippine peso (₱), formatted with the PHP currency pipe.
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  categories: string[];
  popular: boolean;
  favorite: boolean;
  description: string;
}

const STAY_POLICY =
  ' Check-in is from 2:00 PM and check-out is 11:00 AM. Free cancellation up to 48 hours before arrival.';

// Extra gallery photos for the three preview thumbnails on the details page.
const GALLERY_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
];

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class HomePage {
  searchTerm = '';
  activeCategory = '';

  featuredBadge = 'Seasonal pick';

  categories: Category[] = [
    { id: 'hotels', label: 'Hotels' },
    { id: 'resorts', label: 'Resorts' },
    { id: 'beach', label: 'Beach' },
  ];

  destinations: Destination[] = [
    {
      id: 1,
      name: 'Siargao',
      country: 'Surigao del Norte, PH',
      price: 8900,
      rating: 4.9,
      reviewCount: 1280,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
      categories: ['beach', 'resorts'],
      popular: false,
      favorite: false,
      description:
        'Experience pristine tropical waters, world-class surfing waves, and island scenery.' + STAY_POLICY,
    },
    {
      id: 2,
      name: 'El Nido',
      country: 'Palawan, PH',
      price: 6499,
      rating: 4.9,
      reviewCount: 2310,
      image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&q=80',
      categories: ['resorts', 'beach'],
      popular: true,
      favorite: true,
      description:
        'Limestone cliffs, hidden lagoons, and island-hopping tours right from the shore.' + STAY_POLICY,
    },
    {
      id: 3,
      name: 'Boracay',
      country: 'Aklan, PH',
      price: 5200,
      rating: 4.7,
      reviewCount: 3894,
      image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cddff8?w=600&q=80',
      categories: ['hotels', 'beach'],
      popular: true,
      favorite: false,
      description:
        'White Beach sunsets, water sports, and lively nightlife within walking distance.' + STAY_POLICY,
    },
    {
      id: 4,
      name: 'Bali',
      country: 'Indonesia',
      price: 18500,
      rating: 4.6,
      reviewCount: 4218,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
      categories: ['resorts', 'beach'],
      popular: false,
      favorite: false,
      description:
        "A cliffside retreat overlooking the Indian Ocean, a short walk from Uluwatu's surf breaks. The stay includes a private pool villa, daily breakfast, and airport transfer." +
        STAY_POLICY,
    },
    {
      id: 5,
      name: 'Kyoto',
      country: 'Japan',
      price: 24900,
      rating: 4.8,
      reviewCount: 1764,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
      categories: ['hotels'],
      popular: false,
      favorite: false,
      description:
        'Quiet temple districts, traditional streets, and a calm base for exploring the old capital.' +
        STAY_POLICY,
    },
  ];

  constructor(private router: Router) {
    addIcons({
      'person-circle-outline': personCircleOutline,
      'notifications-outline': notificationsOutline,
      'search-outline': searchOutline,
      heart: heart,
      'heart-outline': heartOutline,
      star: star,
      'arrow-forward': arrowForward,
    });
  }

  get featured(): Destination {
    return this.destinations[0];
  }

  get isFiltering(): boolean {
    return !!this.searchTerm.trim() || !!this.activeCategory;
  }

  get sectionLabel(): string {
    return this.isFiltering ? 'Results' : 'Popular this week';
  }

  // With no search or category, show the popular picks; otherwise search everything.
  get visibleDestinations(): Destination[] {
    if (!this.isFiltering) {
      return this.destinations.filter((d) => d.popular);
    }
    const query = this.searchTerm.trim().toLowerCase();
    return this.destinations.filter((d) => {
      const matchesCategory = !this.activeCategory || d.categories.includes(this.activeCategory);
      const matchesText = !query || `${d.name} ${d.country}`.toLowerCase().includes(query);
      return matchesCategory && matchesText;
    });
  }

  onProfile() {
    this.router.navigate(['/user-setting']);
  }

  onQuickAccess() {
    // TODO: open notifications / account shortcuts
  }

  // Tapping the active category again clears the filter.
  onCategorySelect(cat: Category) {
    this.activeCategory = this.activeCategory === cat.id ? '' : cat.id;
  }

  openDetails(dest: Destination) {
    this.router.navigate(['/destination-details'], {
      state: {
        destination: {
          ...dest,
          heroImage: dest.image,
          thumbnails: [dest.image, ...GALLERY_PHOTOS],
        },
      },
    });
  }

  onToggleFavorite(dest: Destination, event: Event) {
    event.stopPropagation();
    dest.favorite = !dest.favorite;
  }
}