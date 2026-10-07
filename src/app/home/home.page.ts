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
  arrowForward
} from 'ionicons/icons';


interface Category {
  id: string;
  label: string;
}


interface Destination {
  id: number;
  name: string;
  country: string;

  // Demo booking price per night in Philippine peso
  price: number;

  rating: number;
  reviewCount: number;

  image: string;

  // Used by the category filter
  categories: string[];

  // Used to determine which destinations appear
  // under "Popular this week"
  popular: boolean;

  favorite: boolean;

  description: string;
}


// Common booking policy shown in the destination description.
const STAY_POLICY =
  ' Check-in is from 2:00 PM and check-out is 11:00 AM. Free cancellation up to 48 hours before arrival.';


// Extra gallery photos used by the destination-details page.
const GALLERY_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
  'assets/img/palui1.jpg',
  'assets/img/palui2.jpg',
  'assets/img/palui3.jpg'

];


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ],
})


export class HomePage {

  // Search box value
  searchTerm = '';

  // Currently selected category
  activeCategory = '';


  // Text shown on the featured destination
  featuredBadge = 'Featured destination';


  // Categories shown in the Home page
  categories: Category[] = [
    {
      id: 'beach',
      label: 'Beach'
    },
    {
      id: 'resorts',
      label: 'Resorts'
    },
    {
      id: 'nature',
      label: 'Nature'
    },
    {
      id: 'cave',
      label: 'Caves'
    },
    {
      id: 'waterfall',
      label: 'Waterfalls'
    }
  ];


  // ============================================================
  // CAGAYAN VALLEY DESTINATIONS
  // ============================================================

  destinations: Destination[] = [

    // ----------------------------------------------------------
    // 1. PALAUÍ ISLAND
    // ----------------------------------------------------------

    {
      id: 1,

      name: 'Palaui Island',

      country: 'Santa Ana, Cagayan',

      price: 2500,

      rating: 4.8,

      reviewCount: 186,

      image:
        'src/assets/img/palui1.jpg',

      categories: [
        'beach',
        'nature'
      ],

      popular: true,

      favorite: false,

      description:
        'A beautiful island destination in Santa Ana, Cagayan known for its beaches, coastal scenery, and Cape Engaño Lighthouse. Enjoy a relaxing island getaway with sightseeing and nature activities.' +
        STAY_POLICY
    },
    
    // ----------------------------------------------------------
    // 2. ANG UIB BEACH
    // ----------------------------------------------------------

    {
      id: 2,

      name: 'Anguib Beach',

      country: 'Santa Ana, Cagayan',

      price: 2200,

      rating: 4.7,

      reviewCount: 327,

      image:
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',

      categories: [
        'beach',
        'resorts'
      ],

      popular: true,

      favorite: true,

      description:
        'A peaceful beach destination in Santa Ana, Cagayan featuring fine white sand and clear coastal waters. It is ideal for travelers looking for a relaxing beach trip and outdoor activities.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 3. CALLAO CAVE
    // ----------------------------------------------------------

    {
      id: 3,

      name: 'Callao Cave',

      country: 'Peñablanca, Cagayan',

      price: 1800,

      rating: 4.8,

      reviewCount: 412,

      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',

      categories: [
        'cave',
        'nature'
      ],

      popular: true,

      favorite: false,

      description:
        'A famous limestone cave destination in Peñablanca, Cagayan known for its large chambers, natural rock formations, and scenic surroundings.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 4. GOVERNOR'S RAPIDS
    // ----------------------------------------------------------

    {
      id: 4,

      name: "Governor's Rapids",

      country: 'Maddela, Quirino',

      price: 2800,

      rating: 4.7,

      reviewCount: 198,

      image:
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',

      categories: [
        'nature'
      ],

      popular: true,

      favorite: false,

      description:
        'An adventure destination in Quirino featuring scenic river views, limestone formations, and beautiful natural surroundings. A great choice for travelers looking for outdoor experiences.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 5. AGLIPAY CAVES
    // ----------------------------------------------------------

    {
      id: 5,

      name: 'Aglipay Caves',

      country: 'Aglipay, Quirino',

      price: 1900,

      rating: 4.6,

      reviewCount: 154,

      image:
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',

      categories: [
        'cave',
        'nature'
      ],

      popular: false,

      favorite: false,

      description:
        'A nature and adventure destination in Quirino featuring caves surrounded by forests and scenic landscapes. It is suitable for travelers interested in outdoor exploration.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 6. SIITAN NATURE'S PARK
    // ----------------------------------------------------------

    {
      id: 6,

      name: "Siitan Nature's Park",

      country: 'Nagtipunan, Quirino',

      price: 2100,

      rating: 4.6,

      reviewCount: 143,

      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',

      categories: [
        'nature'
      ],

      popular: false,

      favorite: false,

      description:
        "A nature destination in Quirino surrounded by forests, rock formations, and scenic landscapes. Siitan Nature's Park is a good choice for travelers looking for a quiet outdoor escape." +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 7. IMUGAN FALLS
    // ----------------------------------------------------------

    {
      id: 7,

      name: 'Imugan Falls',

      country: 'Santa Fe, Nueva Vizcaya',

      price: 2300,

      rating: 4.7,

      reviewCount: 221,

      image:
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80',

      categories: [
        'waterfall',
        'nature'
      ],

      popular: true,

      favorite: false,

      description:
        'A refreshing waterfall destination in Nueva Vizcaya surrounded by lush greenery and forest scenery. It offers travelers a peaceful place to enjoy nature and outdoor activities.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 8. CAPISAAN CAVE
    // ----------------------------------------------------------

    {
      id: 8,

      name: 'Capisaan Cave',

      country: 'Kasibu, Nueva Vizcaya',

      price: 2000,

      rating: 4.6,

      reviewCount: 119,

      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',

      categories: [
        'cave',
        'nature'
      ],

      popular: false,

      favorite: false,

      description:
        'A cave adventure destination in Nueva Vizcaya featuring underground rock formations and natural surroundings. It is suited for travelers interested in exploring the natural landscapes of Cagayan Valley.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 9. DIBULO FALLS
    // ----------------------------------------------------------

    {
      id: 9,

      name: 'Dibulo Falls',

      country: 'Dinapigue, Isabela',

      price: 2400,

      rating: 4.7,

      reviewCount: 176,

      image:
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80',

      categories: [
        'waterfall',
        'nature'
      ],

      popular: false,

      favorite: false,

      description:
        'A scenic waterfall destination in Isabela surrounded by greenery and natural landscapes. Dibulo Falls is a great choice for travelers who want a refreshing outdoor experience in Cagayan Valley.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 10. ILAGAN SANCTUARY
    // ----------------------------------------------------------

    {
      id: 10,

      name: 'Ilagan Sanctuary',

      country: 'Ilagan, Isabela',

      price: 1700,

      rating: 4.5,

      reviewCount: 132,

      image:
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80',

      categories: [
        'nature'
      ],

      popular: false,

      favorite: false,

      description:
        'A nature destination in Ilagan, Isabela surrounded by forests and mountain scenery. It provides visitors with a peaceful environment for sightseeing and enjoying the natural beauty of Cagayan Valley.' +
        STAY_POLICY
    }

  ];


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(private router: Router) {

    addIcons({

      'person-circle-outline':
        personCircleOutline,

      'notifications-outline':
        notificationsOutline,

      'search-outline':
        searchOutline,

      heart:
        heart,

      'heart-outline':
        heartOutline,

      star:
        star,

      'arrow-forward':
        arrowForward

    });

  }


  // ============================================================
  // FEATURED DESTINATION
  // ============================================================

  get featured(): Destination {

    return this.destinations[0];

  }


  // ============================================================
  // CHECK IF SEARCH OR CATEGORY FILTER IS ACTIVE
  // ============================================================

  get isFiltering(): boolean {

    return (
      !!this.searchTerm.trim() ||
      !!this.activeCategory
    );

  }


  // ============================================================
  // SECTION TITLE
  // ============================================================

  get sectionLabel(): string {

    return this.isFiltering
      ? 'Results'
      : 'Popular this week';

  }


  // ============================================================
  // DESTINATIONS DISPLAYED ON HOME PAGE
  // ============================================================

  get visibleDestinations(): Destination[] {

    // When the user has not searched or selected
    // a category, only show popular destinations.
    if (!this.isFiltering) {

      return this.destinations.filter(
        (destination) => destination.popular
      );

    }


    // Get search text
    const query =
      this.searchTerm
        .trim()
        .toLowerCase();


    // Filter destinations
    return this.destinations.filter(
      (destination) => {

        // Check category
        const matchesCategory =
          !this.activeCategory ||
          destination.categories.includes(
            this.activeCategory
          );


        // Check search text
        const matchesText =
          !query ||
          `${destination.name} ${destination.country}`
            .toLowerCase()
            .includes(query);


        return (
          matchesCategory &&
          matchesText
        );

      }
    );

  }


  // ============================================================
  // PROFILE
  // ============================================================

  onProfile() {

    this.router.navigate([
      '/user-setting'
    ]);

  }


  // ============================================================
  // QUICK ACCESS / NOTIFICATIONS
  // ============================================================

  onQuickAccess() {

    // TODO:
    // Open notifications or account shortcuts.

  }


  // ============================================================
  // CATEGORY SELECT
  // ============================================================

  onCategorySelect(
    cat: Category
  ) {

    // Clicking the same category again
    // removes the filter.

    this.activeCategory =
      this.activeCategory === cat.id
        ? ''
        : cat.id;

  }


  // ============================================================
  // OPEN DESTINATION DETAILS
  // ============================================================

  openDetails(
    dest: Destination
  ) {

    this.router.navigate(
      ['/destination-details'],
      {
        state: {

          destination: {

            ...dest,

            // The details page expects heroImage.
            heroImage: dest.image,

            // Keep three images for the
            // destination details page.
            thumbnails: [
              dest.image,
              ...GALLERY_PHOTOS
            ]

          }

        }

      }
    );

  }


  // ============================================================
  // FAVORITE BUTTON
  // ============================================================

  onToggleFavorite(
    dest: Destination,
    event: Event
  ) {

    // Prevent the destination card from opening
    // when the heart button is clicked.
    event.stopPropagation();


    // Toggle favorite status
    dest.favorite =
      !dest.favorite;

  }

}