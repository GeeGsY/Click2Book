import { SupabaseService } from './supabase.service';
import type { Click2BookProfile } from './supabase.service';
import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
}

export interface Booking {
  id: string;
  destinationName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  total: number; // Philippine peso (₱)
  method: string;
  createdAt: string;
  status?: 'confirmed' | 'cancelled' | 'completed';
  cancelledAt?: string;
}

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

// Only the last 4 digits of a number are ever kept.
export interface PaymentMethodInfo {
  id: string;
  type: 'ewallet' | 'card' | 'bank';
  label: string;
  last4: string;
  isDefault: boolean;
}

// A copy of a place when it is saved, so Saved destinations can show it later.
export interface SavedPlace {
  id: number;
  name: string;
  country: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  gallery?: string[];
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'host';
  text: string;
  sentAt: string; // ISO date-time
}

export interface ChatThread {
  id: string; // the conversation name, e.g. "Boracay, Aklan"
  title: string;
  image?: string;
  last: ChatMessage;
  unread: number;
}

export interface AppNotification {
  id: string;
  type: 'welcome' | 'booking' | 'message';
  title: string;
  text: string;
  createdAt: string;
  read: boolean;
  thread?: string; // for message notifications: the conversation to open
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export type UserRole = 'user' | 'admin';

interface Account extends UserProfile {
  passwordHash: string;
  role?: UserRole; // accounts without a role are normal users
}

// A booking together with the guest who made it, for the admin screens.
export interface AdminBooking {
  booking: Booking;
  guestName: string;
  guestEmail: string;
}

export interface AdminStats {
  guests: number;
  bookings: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  revenue: number; // cancelled bookings are refunded, so they are not counted
}

interface UserData {
  bookings: Booking[];
  favorites: number[];
  messages?: Record<string, ChatMessage[]>; // one conversation per place, keyed by its name
  threadImages?: Record<string, string>;
  lastRead?: Record<string, string>; // when each conversation was last opened
  notifications?: AppNotification[];
  starterAdded?: boolean;
  paymentMethods?: PaymentMethodInfo[];
  savedPlaces?: Record<number, SavedPlace>;
}

interface StoredState {
  accounts: Account[];
  data: Record<string, UserData>;
}

const STORAGE_KEY = 'click2book.state.v1';
const SESSION_KEY = 'click2book.session.v1';

// Demo admin account, created the first time the app opens. These details are in the
// source code on purpose for the school demo; a real app would never ship a password.
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin101';

// Sample conversations every account starts with, so the inbox is not empty.
// Remove this list (and the starter code that uses it) once real hosts exist.
const SAMPLE_CHATS = [
  {
    title: 'Palaui Island, Santa Ana, Cagayan',
    image: 'assets/img/palui1.jpg',
    text: 'Magandang araw! Welcome to Palaui Island. Boats leave Santa Ana port in the morning, so tell us your arrival time and we will arrange your transfer.',
    hoursAgo: 3,
  },
  {
    title: 'Anguib Beach, Santa Ana, Cagayan',
    image: undefined,
    text: 'Hi! Thanks for your interest in Anguib Beach. Let us know your dates and how many guests are coming.',
    hoursAgo: 26,
  },
  {
    title: 'Callao Cave, Peñablanca, Cagayan',
    image: undefined,
    text: 'Hello! The caves are open daily from 8:00 AM. Ask us anything about tours and nearby stays.',
    hoursAgo: 50,
  },
];

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

// How a booking looks in the Supabase "bookings" table (see bookings.sql).
interface BookingRow {
  id: string;
  user_id: string;
  guest_name: string;
  guest_email: string;
  destination_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  total: number;
  method: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  cancelled_at: string | null;
  created_at: string;
}

function bookingFromRow(row: BookingRow): Booking {
  return {
    id: row.id,
    destinationName: row.destination_name,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    total: row.total,
    method: row.method,
    createdAt: row.created_at,
    status: row.status,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}

/**
 * One shared place for the logged-in user, their bookings and saved
 * destinations, so Login, Register, Home, Payment and User Settings all show
 * the same data. It is saved in the browser's localStorage because the skeleton
 * prototype has no backend yet; swap the methods for API calls later.
 */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  constructor(
  private supabaseService: SupabaseService,
) {
    // After a page reload the Supabase login is still there, so load the bookings again.
    if (this.session) {
      void this.refreshAll();
    }
  }
  private state: StoredState = this.load();

  // Bookings loaded from Supabase (see the Bookings section below).
  private remoteBookings: Booking[] = [];
  private remoteAdminBookings: AdminBooking[] = [];
  private remoteGuestCount = 0;

  // Who is logged in. Kept per visit (sessionStorage) instead of forever, so closing
  // and reopening the app always starts at the Login page. Accounts, bookings and
  // saved destinations stay saved in localStorage.
  private session: string | null = this.loadSession();

  // Bumped on every change so screens that read the getters below refresh by themselves
  // (the app runs without zone.js).
  private revision = signal(0);

  // Resolves once the demo admin account exists (its password is hashed, which takes a moment).
  private ready: Promise<void> = Promise.resolve();

  attachSupabaseUser(profile: Click2BookProfile): void {
  const email = profile.email.trim().toLowerCase();

  let account = this.state.accounts.find(
    (item) => item.email === email,
  );

  if (!account) {
    account = {
      name: profile.full_name || email.split('@')[0],
      email,
      phone: profile.phone ?? '',
      passwordHash: '',
      role: profile.role,
    };

    this.state.accounts.push(account);
  } else {
    account.name = profile.full_name || account.name;
    account.phone = profile.phone ?? '';
    account.role = profile.role;
  }

  if (!this.state.data[email]) {
    this.state.data[email] = {
      bookings: [],
      favorites: [],
    };
  }

  this.setSession(email);
  this.save();
  void this.refreshAll();
}

  // ---------- Session ----------

  get user(): UserProfile | null {
    const account = this.currentAccount();
    return account ? { name: account.name, email: account.email, phone: account.phone ?? '' } : null;
  }

  // Saves the name and phone in the Supabase "profiles" table.
  async updateProfile(name: string, phone: string): Promise<AuthResult> {
    const account = this.currentAccount();
    if (!account) return { ok: false, error: 'You are not logged in.' };

    const cleanName = name.trim();
    if (cleanName.length < 2) return { ok: false, error: 'Please enter your name.' };

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone && !/^(09\d{9}|\+?639\d{9})$/.test(cleanPhone)) {
      return { ok: false, error: 'Enter a valid mobile number, like 0917 123 4567.' };
    }

    const userId = await this.authUserId();
    if (!userId) return { ok: false, error: 'You are not logged in. Please log in again.' };

    const { data, error } = await this.supabaseService.supabase
      .from('profiles')
      .update({ full_name: cleanName, phone: cleanPhone || null })
      .eq('id', userId)
      .select('id');

    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) {
      return { ok: false, error: 'Your profile could not be saved. Please log in again and try once more.' };
    }

    account.name = cleanName;
    account.phone = cleanPhone;
    this.save();
    return { ok: true };
  }

  // Checks the current password with Supabase, then sets the new one.
  async changePassword(current: string, next: string): Promise<AuthResult> {
    const account = this.currentAccount();
    if (!account) return { ok: false, error: 'You are not logged in.' };

    if (next.length < 6) return { ok: false, error: 'The new password must be at least 6 characters.' };
    if (next === current) {
      return { ok: false, error: 'Choose a password that is different from your current one.' };
    }

    const check = await this.supabaseService.supabase.auth.signInWithPassword({
      email: account.email,
      password: current,
    });
    if (check.error) return { ok: false, error: 'Your current password is incorrect.' };

    const { error } = await this.supabaseService.supabase.auth.updateUser({ password: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // Deletes the account in Supabase (and its bookings), then clears this device.
  async deleteAccount(): Promise<AuthResult> {
    const email = this.session;
    if (!email) return { ok: false, error: 'You are not logged in.' };

    const { error } = await this.supabaseService.supabase.rpc('delete_my_account');
    if (error) return { ok: false, error: error.message };

    try {
      await this.supabaseService.signOut();
    } catch {
      // The account is already gone; a failed sign-out call changes nothing.
    }

    this.state.accounts = this.state.accounts.filter((a) => a.email !== email);
    delete this.state.data[email];
    this.setSession(null);
    this.save();
    return { ok: true };
  }

  get isAdmin(): boolean {
    this.revision();
    return this.currentAccount()?.role === 'admin';
  }

  get isLoggedIn(): boolean {
    return this.currentAccount() !== null;
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    await this.ready;
    const cleanName = name.trim();
    const cleanEmail = this.normalizeEmail(email);

    if (cleanName.length < 2) return { ok: false, error: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    if (this.state.accounts.some((a) => a.email === cleanEmail)) {
      return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    }

    const passwordHash = await this.hash(cleanEmail, password);
    this.state.accounts.push({ name: cleanName, email: cleanEmail, passwordHash });
    this.state.data[cleanEmail] = { bookings: [], favorites: [] };
    this.setSession(cleanEmail);
    this.save();
    return { ok: true };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    await this.ready;
    const cleanEmail = this.normalizeEmail(email);
    if (!cleanEmail || !password) {
      return { ok: false, error: 'Please enter your email and password.' };
    }

    const account = this.state.accounts.find((a) => a.email === cleanEmail);
    const passwordHash = await this.hash(cleanEmail, password);
    if (!account || account.passwordHash !== passwordHash) {
      return { ok: false, error: 'Incorrect email or password.' };
    }

    this.setSession(cleanEmail);
    return { ok: true };
  }

 async logout(): Promise<void> {
  try {
    await this.supabaseService.signOut();
  } finally {
    this.setSession(null);
  }
}
  // ---------- Bookings (saved in Supabase) ----------

  // The logged-in guest's bookings, newest first. Loaded from Supabase in the
  // background; reading this inside a template refreshes when they arrive.
  get bookings(): Booking[] {
    this.revision();
    return this.remoteBookings;
  }

  // Loads the logged-in guest's bookings from Supabase.
  async refreshBookings(): Promise<void> {
    const userId = await this.authUserId();
    if (!userId) {
      this.remoteBookings = [];
      this.revision.update((v) => v + 1);
      return;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) {
      this.remoteBookings = (data as BookingRow[]).map(bookingFromRow);
      this.revision.update((v) => v + 1);
    }
  }

  // Admin only: loads every guest's bookings and the number of guests.
  async refreshAdminBookings(): Promise<void> {
    if (!this.isAdmin) return;

    const { data, error } = await this.supabaseService.supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      this.remoteAdminBookings = (data as BookingRow[]).map((row) => ({
        booking: bookingFromRow(row),
        guestName: row.guest_name || row.guest_email,
        guestEmail: row.guest_email,
      }));
    }

    const guests = await this.supabaseService.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user');
    this.remoteGuestCount = guests.error
      ? new Set(this.remoteAdminBookings.map((x) => x.guestEmail)).size
      : (guests.count ?? 0);

    this.revision.update((v) => v + 1);
  }

  // Saves a new booking in Supabase. Returns null (and sets bookingError) if it fails.
  async addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking | null> {
    this.bookingError = '';
    const userId = await this.authUserId();
    if (!userId) {
      this.bookingError = 'You are not logged in. Please log in again.';
      return null;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('bookings')
      .insert({
        user_id: userId,
        destination_name: booking.destinationName,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        nights: booking.nights,
        total: booking.total,
        method: booking.method,
      })
      .select()
      .single();

    if (error) {
      this.bookingError = error.message;
      return null;
    }

    const saved = bookingFromRow(data as BookingRow);
    this.remoteBookings = [saved, ...this.remoteBookings];

    // Notifications are still kept in this browser (they are not on Supabase yet).
    const local = this.currentData();
    if (local) {
      this.pushNotification(local, {
        type: 'booking',
        title: 'Booking confirmed',
        text: `${booking.destinationName} · ${booking.nights} night${booking.nights === 1 ? '' : 's'} · ${peso.format(booking.total)} paid`,
      });
    }
    this.save();
    return saved;
  }

  // Why the last addBooking failed (for the Payment page to show).
  bookingError = '';

  getBooking(id: string): Booking | null {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  get latestBooking(): Booking | null {
    const list = this.bookings;
    return list.length > 0 ? list.reduce((a, b) => (b.createdAt > a.createdAt ? b : a)) : null;
  }

  statusOf(booking: Booking): BookingStatus {
    if (booking.status === 'cancelled') return 'cancelled';
    if (booking.status === 'completed') return 'completed';
    return booking.checkOut < this.todayIso() ? 'completed' : 'upcoming';
  }

  // Free cancellation until 48 hours before check-in (2:00 PM), as the place descriptions say.
  canCancel(booking: Booking): boolean {
    if (this.statusOf(booking) !== 'upcoming') return false;
    const checkInTime = new Date(`${booking.checkIn}T14:00:00`).getTime();
    return checkInTime - Date.now() >= 48 * 60 * 60 * 1000;
  }

  async cancelBooking(id: string): Promise<AuthResult> {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return { ok: false, error: 'Booking not found.' };

    if (!this.canCancel(booking)) {
      return { ok: false, error: 'Free cancellation has closed for this booking (less than 48 hours to check-in).' };
    }

    // The database checks the 48-hour rule again, so it cannot be skipped from the browser.
    const { error } = await this.supabaseService.supabase.rpc('cancel_booking', { p_id: id });
    if (error) return { ok: false, error: error.message };

    await this.refreshBookings();

    const local = this.currentData();
    if (local) {
      this.pushNotification(local, {
        type: 'booking',
        title: 'Booking cancelled',
        text: `${booking.destinationName} · ${peso.format(booking.total)} will be refunded (prototype)`,
      });
      this.save();
    }
    return { ok: true };
  }

  get upcomingCount(): number {
    return this.bookings.filter((b) => this.statusOf(b) === 'upcoming').length;
  }

  get completedCount(): number {
    return this.bookings.filter((b) => this.statusOf(b) === 'completed').length;
  }

  // Cancelled bookings are refunded, so they do not count as spent.
  get totalSpent(): number {
    return this.bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.total, 0);
  }

  // ---------- Admin ----------

  // Every booking made by every guest, newest first (admin only).
  get allBookings(): AdminBooking[] {
    this.revision();
    return this.isAdmin ? this.remoteAdminBookings : [];
  }

  get adminStats(): AdminStats {
    const all = this.allBookings;
    const count = (status: BookingStatus) => all.filter((x) => this.statusOf(x.booking) === status).length;
    return {
      guests: this.remoteGuestCount,
      bookings: all.length,
      upcoming: count('upcoming'),
      completed: count('completed'),
      cancelled: count('cancelled'),
      revenue: all.filter((x) => x.booking.status !== 'cancelled').reduce((sum, x) => sum + x.booking.total, 0),
    };
  }

  // The admin marks a stay as finished, or cancels it (checked again by the database).
  async adminUpdateBooking(bookingId: string, status: 'completed' | 'cancelled'): Promise<AuthResult> {
    if (!this.isAdmin) return { ok: false, error: 'Only an admin can do this.' };

    const { error } = await this.supabaseService.supabase.rpc('admin_update_booking', {
      p_id: bookingId,
      p_status: status,
    });
    if (error) return { ok: false, error: error.message };

    await this.refreshAdminBookings();
    return { ok: true };
  }

  // ---------- Messages ----------

  getMessages(thread: string): ChatMessage[] {
    return [...(this.currentData()?.messages?.[thread] ?? [])];
  }

  addMessage(
    thread: string,
    from: ChatMessage['from'],
    text: string,
    options: { sentAt?: string; notify?: boolean } = {},
  ): ChatMessage | null {
    const data = this.currentData();
    if (!data) return null;

    data.messages ??= {};
    data.messages[thread] ??= [];
    const message: ChatMessage = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      from,
      text,
      sentAt: options.sentAt ?? new Date().toISOString(),
    };
    data.messages[thread].push(message);

    // A new message from a host that the user is not looking at becomes a notification.
    if (from === 'host' && options.notify) {
      this.pushNotification(data, {
        type: 'message',
        title: `New message from ${thread.split(',')[0]}`,
        text,
        thread,
      });
    }
    this.save();
    return message;
  }

  // One entry per conversation, newest first.
  get threads(): ChatThread[] {
    this.revision();
    const data = this.currentData();
    if (!data?.messages) return [];

    return Object.entries(data.messages)
      .filter(([, list]) => list.length > 0)
      .map(([title, list]) => {
        const readAt = data.lastRead?.[title] ?? '';
        return {
          id: title,
          title,
          image: data.threadImages?.[title],
          last: list[list.length - 1],
          unread: list.filter((m) => m.from === 'host' && m.sentAt > readAt).length,
        };
      })
      .sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt));
  }

  markThreadRead(thread: string): void {
    const data = this.currentData();
    if (!data) return;
    data.lastRead ??= {};
    data.lastRead[thread] = new Date().toISOString();
    this.save();
  }

  setThreadImage(thread: string, image: string): void {
    const data = this.currentData();
    if (!data || data.threadImages?.[thread] === image) return;
    data.threadImages ??= {};
    data.threadImages[thread] = image;
    this.save();
  }

  // ---------- Notifications ----------

  get notifications(): AppNotification[] {
    this.revision();
    const list = this.currentData()?.notifications ?? [];
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get unreadNotificationCount(): number {
    this.revision();
    return (this.currentData()?.notifications ?? []).filter((n) => !n.read).length;
  }

  markNotificationRead(id: string): void {
    const note = this.currentData()?.notifications?.find((n) => n.id === id);
    if (note && !note.read) {
      note.read = true;
      this.save();
    }
  }

  markAllNotificationsRead(): void {
    const list = this.currentData()?.notifications;
    if (list?.some((n) => !n.read)) {
      list.forEach((n) => (n.read = true));
      this.save();
    }
  }

  // Adds the welcome notification and the sample conversations once per account.
  ensureStarterData(): void {
    if (this.isAdmin) return;
    const data = this.currentData();
    if (!data || data.starterAdded) return;

    data.starterAdded = true;
    this.pushNotification(data, {
      type: 'welcome',
      title: 'Welcome to Click2Book',
      text: 'Search a destination, pick your dates, and book in a few taps. Your chats and bookings will show up here.',
    });

    if (!data.messages || Object.keys(data.messages).length === 0) {
      data.messages = {};
      data.threadImages = {};
      for (const chat of SAMPLE_CHATS) {
        const sentAt = new Date(Date.now() - chat.hoursAgo * 3600 * 1000).toISOString();
        data.messages[chat.title] = [
          { id: `sample-${chat.title}`, from: 'host', text: chat.text, sentAt },
        ];
        if (chat.image) data.threadImages[chat.title] = chat.image;
      }
    }
    this.save();
  }

  // ---------- Saved destinations ----------

  get favoritesCount(): number {
    return this.currentData()?.favorites.length ?? 0;
  }

  isFavorite(destinationId: number): boolean {
    return this.currentData()?.favorites.includes(destinationId) ?? false;
  }

  toggleFavorite(destinationId: number, place?: SavedPlace): void {
    const data = this.currentData();
    if (!data) return;

    if (data.favorites.includes(destinationId)) {
      data.favorites = data.favorites.filter((id) => id !== destinationId);
      if (data.savedPlaces) delete data.savedPlaces[destinationId];
    } else {
      data.favorites = [...data.favorites, destinationId];
      if (place) {
        data.savedPlaces ??= {};
        data.savedPlaces[destinationId] = place;
      }
    }
    this.save();
  }

  // Fills in the copy of a place that was saved before copies were kept.
  rememberFavorite(destinationId: number, place: SavedPlace): void {
    const data = this.currentData();
    if (!data || !data.favorites.includes(destinationId) || data.savedPlaces?.[destinationId]) return;

    data.savedPlaces ??= {};
    data.savedPlaces[destinationId] = place;
    this.save();
  }

  // Saved places, most recently saved first.
  get savedPlaces(): SavedPlace[] {
    this.revision();
    const data = this.currentData();
    if (!data) return [];

    return [...data.favorites]
      .reverse()
      .map((id) => data.savedPlaces?.[id])
      .filter((place): place is SavedPlace => !!place);
  }

  // ---------- Payment methods ----------

  get paymentMethods(): PaymentMethodInfo[] {
    this.revision();
    return [...(this.currentData()?.paymentMethods ?? [])];
  }

  get defaultPaymentMethod(): PaymentMethodInfo | null {
    return this.paymentMethods.find((m) => m.isDefault) ?? null;
  }

  addPaymentMethod(type: PaymentMethodInfo['type'], label: string, number: string): AuthResult {
    const data = this.currentData();
    if (!data) return { ok: false, error: 'You are not logged in.' };

    const name = label.trim();
    const digits = number.replace(/\D/g, '');
    const limits = { ewallet: [10, 12], card: [13, 19], bank: [8, 16] }[type];
    const numberName = { ewallet: 'mobile number', card: 'card number', bank: 'account number' }[type];

    if (name.length < 2) return { ok: false, error: 'Give this payment method a name, like GCash or BPI Visa.' };
    if (digits.length < limits[0] || digits.length > limits[1]) {
      return { ok: false, error: `Enter a valid ${numberName}.` };
    }

    data.paymentMethods ??= [];
    if (data.paymentMethods.length >= 5) {
      return { ok: false, error: 'You can save up to 5 payment methods. Remove one first.' };
    }

    // Only the last 4 digits are kept; the full number is never stored.
    data.paymentMethods.push({
      id: `pm-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      type,
      label: name,
      last4: digits.slice(-4),
      isDefault: data.paymentMethods.length === 0,
    });
    this.save();
    return { ok: true };
  }

  removePaymentMethod(id: string): void {
    const data = this.currentData();
    if (!data?.paymentMethods) return;

    const wasDefault = data.paymentMethods.find((m) => m.id === id)?.isDefault;
    data.paymentMethods = data.paymentMethods.filter((m) => m.id !== id);
    if (wasDefault && data.paymentMethods.length > 0) {
      data.paymentMethods[0].isDefault = true;
    }
    this.save();
  }

  setDefaultPaymentMethod(id: string): void {
    const data = this.currentData();
    if (!data?.paymentMethods) return;

    data.paymentMethods.forEach((m) => (m.isDefault = m.id === id));
    this.save();
  }

  // ---------- Internals ----------

  private async seedAdmin(): Promise<void> {
    if (this.state.accounts.some((a) => a.email === ADMIN_EMAIL)) return;

    this.state.accounts.push({
      name: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash: await this.hash(ADMIN_EMAIL, ADMIN_PASSWORD),
      role: 'admin',
    });
    this.save();
  }

  private pushNotification(
    data: UserData,
    note: Pick<AppNotification, 'type' | 'title' | 'text' | 'thread'>,
  ): void {
    data.notifications ??= [];
    data.notifications.push({
      ...note,
      id: `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  private currentAccount(): Account | null {
    const email = this.session;
    return email ? this.state.accounts.find((a) => a.email === email) ?? null : null;
  }

  private currentData(): UserData | null {
    const email = this.session;
    if (!email) return null;
    if (!this.state.data[email]) {
      this.state.data[email] = { bookings: [], favorites: [] };
    }
    return this.state.data[email];
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private todayIso(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  // Prototype-only: passwords are never stored as plain text, but a real app
  // must check them on a server instead of in the browser.
  private async hash(email: string, password: string): Promise<string> {
    const text = `${email}::${password}`;
    const subtle = globalThis.crypto?.subtle;

    if (subtle) {
      const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `sha256:${hex}`;
    }

    // Plain-http pages (e.g. testing on a phone over Wi-Fi) have no crypto.subtle.
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) + h) ^ text.charCodeAt(i);
    }
    return `basic:${(h >>> 0).toString(16)}`;
  }

  private load(): StoredState {
    const empty: StoredState = { accounts: [], data: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
        data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
      };
    } catch {
      return empty;
    }
  }

  private loadSession(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  // Loads this person's bookings (and everyone's, for an admin).
  async refreshAll(): Promise<void> {
    await this.refreshBookings();
    if (this.isAdmin) await this.refreshAdminBookings();
  }

  // The id of the person logged in to Supabase, or null.
  private async authUserId(): Promise<string | null> {
    const { data } = await this.supabaseService.supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  private setSession(email: string | null): void {
    this.session = email;
    if (!email) {
      this.remoteBookings = [];
      this.remoteAdminBookings = [];
      this.remoteGuestCount = 0;
    }
    try {
      if (email) {
        sessionStorage.setItem(SESSION_KEY, email);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Storage can be blocked; the login still works until the page is reloaded.
    }
    if (email) {
      this.ensureStarterData();
    }
    this.revision.update((v) => v + 1);
  }

  private save(): void {
    this.revision.update((v) => v + 1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage can be full or blocked (private mode); the app keeps working for this visit.
    }
  }
}