import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Review {
  id: string;
  placeId: number;
  rating: number;
  comment: string;
  // First name only, for privacy
  guestName: string;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  place_id: number;
  rating: number;
  comment: string;
  guest_name: string;
  created_at: string;
}

// Guest reviews, saved in the Supabase "reviews" table (see reviews.sql).
@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private supabase = inject(SupabaseService);

  // The newest written reviews of a place.
  async forPlace(placeId: number, limit = 20): Promise<Review[]> {
    const { data, error } = await this.supabase.supabase
      .from('reviews')
      .select('id, place_id, rating, comment, guest_name, created_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data as ReviewRow[]).map((row) => ({
      id: row.id,
      placeId: Number(row.place_id),
      rating: row.rating,
      comment: row.comment,
      guestName: row.guest_name || 'Guest',
      createdAt: row.created_at,
    }));
  }

  // The ids of the bookings the logged-in guest has already reviewed.
  async myReviewedBookingIds(): Promise<Set<string>> {
    const { data: session } = await this.supabase.supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) return new Set();

    const { data, error } = await this.supabase.supabase
      .from('reviews')
      .select('booking_id')
      .eq('user_id', userId);

    if (error) return new Set();
    return new Set((data as { booking_id: string }[]).map((row) => row.booking_id));
  }

  // The database checks that the stay is completed and not reviewed yet.
  async submit(bookingId: string, rating: number, comment: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await this.supabase.supabase.rpc('submit_review', {
      p_booking_id: bookingId,
      p_rating: rating,
      p_comment: comment.trim(),
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }
}