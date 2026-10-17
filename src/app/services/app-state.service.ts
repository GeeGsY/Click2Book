import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  name: string;
  email: string;
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

interface Account extends UserProfile {
  passwordHash: string;
}

interface UserData {
  bookings: Booking[];
  favorites: number[];
  messages?: Record<string, ChatMessage[]>; // one conversation per place, keyed by its name
  threadImages?: Record<string, string>;
  lastRead?: Record<string, string>; // when each conversation was last opened
  notifications?: AppNotification[];
  starterAdded?: boolean;
}

interface StoredState {
  accounts: Account[];
  data: Record<string, UserData>;
}

const STORAGE_KEY = 'click2book.state.v1';
const SESSION_KEY = 'click2book.session.v1';

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
  private state: StoredState = this.load();

  // Who is logged in. Kept per visit (sessionStorage) instead of forever, so closing
  // and reopening the app always starts at the Login page. Accounts, bookings and
  // saved destinations stay saved in localStorage.
  private session: string | null = this.loadSession();

  // Bumped on every change so screens that read the getters below refresh by themselves
  // (the app runs without zone.js).
  private revision = signal(0);

  // ---------- Session ----------

  get user(): UserProfile | null {
    const account = this.currentAccount();
    return account ? { name: account.name, email: account.email } : null;
  }

  get isLoggedIn(): boolean {
    return this.currentAccount() !== null;
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
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

  logout(): void {
    this.setSession(null);
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
      id: `C2B-${Date.now().toString(36).toUpperCase()}`,
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

  get upcomingCount(): number {
    const today = this.todayIso();
    return this.bookings.filter((b) => b.checkOut >= today).length;
  }

  get completedCount(): number {
    const today = this.todayIso();
    return this.bookings.filter((b) => b.checkOut < today).length;
  }

  get totalSpent(): number {
    return this.bookings.reduce((sum, b) => sum + b.total, 0);
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

  toggleFavorite(destinationId: number): void {
    const data = this.currentData();
    if (!data) return;

    data.favorites = data.favorites.includes(destinationId)
      ? data.favorites.filter((id) => id !== destinationId)
      : [...data.favorites, destinationId];
    this.save();
  }

  // ---------- Internals ----------

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