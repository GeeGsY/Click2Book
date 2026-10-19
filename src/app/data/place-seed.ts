import { Place, STAY_POLICY } from './place.model';

// The places the app starts with (the admin can edit, hide, delete or add to them).
// "Reset sample places" in the admin screen brings this list back.
export const SEED_PLACES: Place[] = [

    // ----------------------------------------------------------
    // 1. PALAUÍ ISLAND
    // ----------------------------------------------------------

    {
      id: 1,
      type: 'destination',

      name: 'Palaui Island',

      country: 'Santa Ana, Cagayan',

      price: 2500,

      rating: 4.8,

      reviewCount: 186,

      image:
        'assets/img/palui1.jpg',

      categories: [
        'beach',
        'nature'
      ],

      popular: true,

      description:
        'A beautiful island destination in Santa Ana, Cagayan known for its beaches, coastal scenery, and Cape Engaño Lighthouse. Enjoy a relaxing island getaway with sightseeing and nature activities.' +
        STAY_POLICY
    },
    
    // ----------------------------------------------------------
    // 2. ANG UIB BEACH
    // ----------------------------------------------------------

    {
      id: 2,
      type: 'destination',

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

      description:
        'A peaceful beach destination in Santa Ana, Cagayan featuring fine white sand and clear coastal waters. It is ideal for travelers looking for a relaxing beach trip and outdoor activities.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 3. CALLAO CAVE
    // ----------------------------------------------------------

    {
      id: 3,
      type: 'destination',

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

      description:
        'A famous limestone cave destination in Peñablanca, Cagayan known for its large chambers, natural rock formations, and scenic surroundings.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 4. GOVERNOR'S RAPIDS
    // ----------------------------------------------------------

    {
      id: 4,
      type: 'destination',

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

      description:
        'An adventure destination in Quirino featuring scenic river views, limestone formations, and beautiful natural surroundings. A great choice for travelers looking for outdoor experiences.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 5. AGLIPAY CAVES
    // ----------------------------------------------------------

    {
      id: 5,
      type: 'destination',

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

      description:
        'A nature and adventure destination in Quirino featuring caves surrounded by forests and scenic landscapes. It is suitable for travelers interested in outdoor exploration.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 6. SIITAN NATURE'S PARK
    // ----------------------------------------------------------

    {
      id: 6,
      type: 'destination',

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

      description:
        "A nature destination in Quirino surrounded by forests, rock formations, and scenic landscapes. Siitan Nature's Park is a good choice for travelers looking for a quiet outdoor escape." +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 7. IMUGAN FALLS
    // ----------------------------------------------------------

    {
      id: 7,
      type: 'destination',

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

      description:
        'A refreshing waterfall destination in Nueva Vizcaya surrounded by lush greenery and forest scenery. It offers travelers a peaceful place to enjoy nature and outdoor activities.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 8. CAPISAAN CAVE
    // ----------------------------------------------------------

    {
      id: 8,
      type: 'destination',

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

      description:
        'A cave adventure destination in Nueva Vizcaya featuring underground rock formations and natural surroundings. It is suited for travelers interested in exploring the natural landscapes of Cagayan Valley.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 9. DIBULO FALLS
    // ----------------------------------------------------------

    {
      id: 9,
      type: 'destination',

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

      description:
        'A scenic waterfall destination in Isabela surrounded by greenery and natural landscapes. Dibulo Falls is a great choice for travelers who want a refreshing outdoor experience in Cagayan Valley.' +
        STAY_POLICY
    },


    // ----------------------------------------------------------
    // 10. ILAGAN SANCTUARY
    // ----------------------------------------------------------

    {
      id: 10,
      type: 'destination',

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

      description:
        'A nature destination in Ilagan, Isabela surrounded by forests and mountain scenery. It provides visitors with a peaceful environment for sightseeing and enjoying the natural beauty of Cagayan Valley.' +
        STAY_POLICY
    }

  ];