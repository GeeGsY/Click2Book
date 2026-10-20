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
) {}
  private state: StoredState = this.load();

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
}

  // ---------- Session ----------

  get user(): UserProfile | null {
    const account = this.currentAccount();
    return account ? { name: account.name, email: account.email, phone: account.phone ?? '' } : null;
  }

  updateProfile(name: string, phone: string): AuthResult {
    const account = this.currentAccount();
    if (!account) return { ok: false, error: 'You are not logged in.' };

    const cleanName = name.trim();
    if (cleanName.length < 2) return { ok: false, error: 'Please enter your name.' };

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone && !/^(09\d{9}|\+?639\d{9})$/.test(cleanPhone)) {
      return { ok: false, error: 'Enter a valid mobile number, like 0917 123 4567.' };
    }

    account.name = cleanName;
    account.phone = cleanPhone;
    this.save();
    return { ok: true };
  }

  async changePassword(current: string, next: string): Promise<AuthResult> {
    const account = this.currentAccount();
    if (!account) return { ok: false, error: 'You are not logged in.' };

    if ((await this.hash(account.email, current)) !== account.passwordHash) {
      return { ok: false, error: 'Your current password is incorrect.' };
    }
    if (next.length < 6) return { ok: false, error: 'The new password must be at least 6 characters.' };
    if (next === current) {
      return { ok: false, error: 'Choose a password that is different from your current one.' };
    }

    account.passwordHash = await this.hash(account.email, next);
    this.save();
    return { ok: true };
  }

  // Removes the account and everything saved for it (bookings, chats, saved places).
  deleteAccount(): void {
    const email = this.session;
    if (!email) return;

    this.state.accounts = this.state.accounts.filter((a) => a.email !== email);
    delete this.state.data[email];
    this.setSession(null);
    this.save();
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
  // ---------- Bookings ----------

  get bookings(): Booking[] {
    return this.currentData()?.bookings ?? [];
  }

  addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking | null {
    const data = this.currentData();
    if (!data) return null;

    const saved: Booking = {
      ...booking,
      id: `C2B-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    data.bookings.push(saved);
    this.pushNotification(data, {
      type: 'booking',
      title: 'Booking confirmed',
      text: `${booking.destinationName} · ${booking.nights} night${booking.nights === 1 ? '' : 's'} · ${peso.format(booking.total)} paid`,
    });
    this.save();
    return saved;
  }

  getBooking(id: string): Booking | null {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  get latestBooking(): Booking | null {
    const list = this.bookings;
    return list.length > 0 ? list[list.length - 1] : null;
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

  cancelBooking(id: string): AuthResult {
    const data = this.currentData();
    const booking = data?.bookings.find((b) => b.id === id);
    if (!data || !booking) return { ok: false, error: 'Booking not found.' };

    if (!this.canCancel(booking)) {
      return { ok: false, error: 'Free cancellation has closed for this booking (less than 48 hours to check-in).' };
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
    this.pushNotification(data, {
      type: 'booking',
      title: 'Booking cancelled',
      text: `${booking.destinationName} · ${peso.format(booking.total)} will be refunded (prototype)`,
    });
    this.save();
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

  // Every booking made by every guest, newest first.
  get allBookings(): AdminBooking[] {
    this.revision();
    if (!this.isAdmin) return [];

    const list: AdminBooking[] = [];
    for (const account of this.state.accounts.filter((a) => a.role !== 'admin')) {
      for (const booking of this.state.data[account.email]?.bookings ?? []) {
        list.push({ booking, guestName: account.name, guestEmail: account.email });
      }
    }
    return list.sort((a, b) => b.booking.createdAt.localeCompare(a.booking.createdAt));
  }

  get adminStats(): AdminStats {
    const all = this.allBookings;
    const count = (status: BookingStatus) => all.filter((x) => this.statusOf(x.booking) === status).length;
    return {
      guests: this.state.accounts.filter((a) => a.role !== 'admin').length,
      bookings: all.length,
      upcoming: count('upcoming'),
      completed: count('completed'),
      cancelled: count('cancelled'),
      revenue: all.filter((x) => x.booking.status !== 'cancelled').reduce((sum, x) => sum + x.booking.total, 0),
    };
  }

  // The admin marks a stay as finished, or cancels it. The guest gets a notification.
  adminUpdateBooking(guestEmail: string, bookingId: string, status: 'completed' | 'cancelled'): AuthResult {
    if (!this.isAdmin) return { ok: false, error: 'Only an admin can do this.' };

    const data = this.state.data[guestEmail];
    const booking = data?.bookings.find((b) => b.id === bookingId);
    if (!data || !booking) return { ok: false, error: 'Booking not found.' };
    if (this.statusOf(booking) === 'cancelled') return { ok: false, error: 'This booking is already cancelled.' };
    if (status === 'completed' && booking.status === 'completed') return { ok: false, error: 'This stay is already completed.' };

    booking.status = status;
    if (status === 'cancelled') {
      booking.cancelledAt = new Date().toISOString();
    }
    this.pushNotification(data, {
      type: 'booking',
      title: status === 'completed' ? 'Stay completed' : 'Booking cancelled',
      text:
        status === 'completed'
          ? `${booking.destinationName} · thanks for staying with us!`
          : `${booking.destinationName} was cancelled by the host · ${peso.format(booking.total)} will be refunded (prototype)`,
    });
    this.save();
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

  private setSession(email: string | null): void {
    this.session = email;
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