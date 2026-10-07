import { Injectable } from '@angular/core';

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
}

interface StoredState {
  accounts: Account[];
  session: string | null; // email of the logged-in account
  data: Record<string, UserData>;
}

const STORAGE_KEY = 'click2book.state.v1';

/**
 * One shared place for the logged-in user, their bookings and saved
 * destinations, so Login, Register, Home, Payment and User Settings all show
 * the same data. It is saved in the browser's localStorage because the skeleton
 * prototype has no backend yet; swap the methods for API calls later.
 */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private state: StoredState = this.load();

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
    this.state.session = cleanEmail;
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

    this.state.session = cleanEmail;
    this.save();
    return { ok: true };
  }

  logout(): void {
    this.state.session = null;
    this.save();
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

  private currentAccount(): Account | null {
    const email = this.state.session;
    return email ? this.state.accounts.find((a) => a.email === email) ?? null : null;
  }

  private currentData(): UserData | null {
    const email = this.state.session;
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
    const empty: StoredState = { accounts: [], session: null, data: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
        session: typeof parsed.session === 'string' ? parsed.session : null,
        data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
      };
    } catch {
      return empty;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage can be full or blocked (private mode); the app keeps working for this visit.
    }
  }
}