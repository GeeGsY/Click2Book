import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  notificationsOutline,
  searchOutline,
  optionsOutline,
  airplaneOutline,
  bedOutline,
  carSportOutline,
  boatOutline,
  sunnyOutline,
  heart,
  heartOutline,
  star,
  arrowForward,
} from 'ionicons/icons';

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface Destination {
  id: number;
  name: string;
  country: string;
  price: string;
  rating: number;
  image: string;
  favorite: boolean;
}

interface Featured {
  id: number;
  name: string;
  country: string;
  badge: string;
  price: string;
  image: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class HomePage implements OnInit {
  userName = 'Leo';
  searchTerm = '';
  activeCategory = 'flights';

  featured: Featured = {
    id: 1,
    name: 'Siargao',
    country: 'Surigao del Norte, PH',
    badge: 'Seasonal pick',
    price: '₱8,900',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  };

  categories: Category[] = [
    { id: 'flights', label: 'Flights', icon: 'airplane-outline' },
    { id: 'stays', label: 'Stays', icon: 'bed-outline' },
    { id: 'cars', label: 'Cars', icon: 'car-sport-outline' },
    { id: 'cruises', label: 'Cruises', icon: 'boat-outline' },
    { id: 'beach', label: 'Beach', icon: 'sunny-outline' },
  ];

  popularDestinations: Destination[] = [
    {
      id: 1,
      name: 'El Nido',
      country: 'Palawan, PH',
      price: '₱6,499',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&q=80',
      favorite: true,
    },
    {
      id: 2,
      name: 'Kyoto',
      country: 'Japan',
      price: '₱24,900',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
      favorite: false,
    },
    {
      id: 3,
      name: 'Boracay',
      country: 'Aklan, PH',
      price: '₱5,200',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cddff8?w=400&q=80',
      favorite: false,
    },
  ];

  constructor(private router: Router) {
    addIcons({
      'person-circle-outline': personCircleOutline,
      'notifications-outline': notificationsOutline,
      'search-outline': searchOutline,
      'options-outline': optionsOutline,
      'airplane-outline': airplaneOutline,
      'bed-outline': bedOutline,
      'car-sport-outline': carSportOutline,
      'boat-outline': boatOutline,
      'sunny-outline': sunnyOutline,
      heart: heart,
      'heart-outline': heartOutline,
      star: star,
      'arrow-forward': arrowForward,
    });
  }

  ngOnInit() {}

  onProfile() {
    // TODO: navigate to profile page
  }

  onQuickAccess() {
    // TODO: open notifications/account shortcuts
  }

  onFeaturedTap() {
    this.router.navigate(['/destination-details'], {
      state: {
        destination: {
          ...this.featured,
          rating: 4.9,
          reviewCount: 1280,
          heroImage: this.featured.image,
          thumbnails: [
            this.featured.image,
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
            'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80'
          ],
          description: 'Experience pristine tropical waters, world-class surfing waves, and island scenery.'
        }
      }
    });
  }

  onSearch() {
    // TODO: filter/search as user types
  }

  onFilter() {
    // TODO: open filter modal
  }

  onCategorySelect(cat: Category) {
    this.activeCategory = cat.id;
    // TODO: filter results by category
  }

  onSeeAllPopular() {
    // TODO: navigate to full popular destinations list
  }

  onDestinationTap(dest: Destination) {
    this.router.navigate(['/destination-details'], {
      state: {
        destination: {
          ...dest,
          reviewCount: 850,
          heroImage: dest.image,
          thumbnails: [
            dest.image,
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
            'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80'
          ],
          description: `Discover the breathtaking beauty of ${dest.name}, offering scenic views, rich culture, and unforgettable travel experiences.`
        }
      }
    });
  }

  onToggleFavorite(dest: Destination, event: Event) {
    event.stopPropagation();
    dest.favorite = !dest.favorite;
  }
}