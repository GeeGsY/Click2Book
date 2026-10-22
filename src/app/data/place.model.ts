// What a place (listing) looks like, shared by Home, the booking pages and the admin screens.

export type PlaceType = 'hotel' | 'resort' | 'rental' | 'destination';

export interface Place {
  id: number;
  name: string;
  type: PlaceType;
  // Where it is, shown under the name (for example "Santa Ana, Cagayan")
  country: string;
  // Price per night in Philippine peso
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  // Used by the category filter on Home
  categories: string[];
  // Shows under "Popular this week"
  popular: boolean;
  description: string;
  // Owner or provider of the place (set by the admin)
  provider?: string;
  // Hidden places are not shown to users
  hidden?: boolean;
  // The place shown in the big card on Home
  featured?: boolean;
  // Optional own photos for the details page
  gallery?: string[];

  // `rating` and `reviewCount` above already include the guests' real reviews.
  // These keep what the admin typed in (the starting numbers) and how many real reviews exist.
  baseRating?: number;
  baseReviewCount?: number;
  guestReviewCount?: number;
}

// The starting rating counts like `baseCount` reviews; real reviews (`sum` of stars, `n` of them) are added to it.
export function combineRating(
  baseRating: number,
  baseCount: number,
  sum: number,
  n: number,
): { rating: number; reviewCount: number } {
  const total = baseCount + n;
  if (n <= 0 || total <= 0) return { rating: Number(baseRating), reviewCount: total };
  const average = (Number(baseRating) * baseCount + sum) / total;
  return { rating: Math.round(average * 10) / 10, reviewCount: total };
}

export interface PlaceOption<T extends string = string> {
  id: T;
  label: string;
}

export const PLACE_TYPES: PlaceOption<PlaceType>[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'resort', label: 'Resort' },
  { id: 'rental', label: 'Vacation rental' },
  { id: 'destination', label: 'Destination' },
];

// Every filter shown on Home. The first three are the place types.
export const CATEGORY_OPTIONS: PlaceOption[] = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'resorts', label: 'Resorts' },
  { id: 'rentals', label: 'Rentals' },
  { id: 'beach', label: 'Beach' },
  { id: 'nature', label: 'Nature' },
  { id: 'cave', label: 'Caves' },
  { id: 'waterfall', label: 'Waterfalls' },
];

// Tags the admin can add to say what is nearby or special about a place.
export const TAG_OPTIONS = CATEGORY_OPTIONS.filter((c) => !['hotels', 'resorts', 'rentals'].includes(c.id));

// The category that matches each place type (destinations have none).
export const TYPE_CATEGORY: Record<PlaceType, string | null> = {
  hotel: 'hotels',
  resort: 'resorts',
  rental: 'rentals',
  destination: null,
};

// Common booking policy shown in the place description.
export const STAY_POLICY =
  ' Check-in is from 2:00 PM and check-out is 11:00 AM. Free cancellation up to 48 hours before arrival.';