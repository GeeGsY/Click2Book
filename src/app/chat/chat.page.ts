import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, send } from 'ionicons/icons';
import { AppStateService, ChatMessage } from '../services/app-state.service';

// The prototype has no server, so the "host" answers with these ready-made replies.
const AUTO_REPLIES: { match: RegExp; reply: string }[] = [
  {
    match: /check.?in|check.?out|arriv|early|late/i,
    reply:
      'Check-in starts at 2:00 PM and check-out is at 11:00 AM. Early check-in depends on availability, so please tell us your arrival time.',
  },
  {
    match: /direction|where|location|map|how do i get|transport|airport|pickup|pick up/i,
    reply: 'We can share directions and arrange a pickup. Where will you be coming from?',
  },
  {
    match: /cancel|refund/i,
    reply: 'Free cancellation is available up to 48 hours before arrival. After that, one night is charged.',
  },
  {
    match: /price|rate|pay|discount|promo|how much/i,
    reply: 'All rates are per night in Philippine peso (₱). You can review the full total before you pay.',
  },
  {
    match: /breakfast|food|meal|eat/i,
    reply: 'Meals can be arranged on request. Let us know how many guests are coming and any food restrictions.',
  },
  {
    match: /guest|extra|person|pax|kid|child|pet/i,
    reply: 'Extra guests are possible. Please tell us how many people are coming so we can confirm.',
  },
  {
    match: /thank|salamat/i,
    reply: "You're welcome! Salamat, and we look forward to hosting you.",
  },
];
const FALLBACK_REPLY = 'Thanks for your message! The host will get back to you shortly.';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class ChatPage implements ViewWillEnter, ViewWillLeave {
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;

  // The app runs without zone.js, so lists and flags that change later are signals.
  title = signal('');
  messages = signal<ChatMessage[]>([]);
  typing = signal(false);
  afterPayment = signal(false);

  draft = '';

  private thread = '';
  private active = false;
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  constructor(
    private router: Router,
    private location: Location,
    private appState: AppStateService,
  ) {
    addIcons({ 'arrow-back-outline': arrowBackOutline, send: send });
    this.load(this.router.getCurrentNavigation()?.extras?.state);
  }

  ionViewWillEnter(): void {
    this.active = true;
    this.load(history.state);
    this.cdr.markForCheck();
  }

  ionViewWillLeave(): void {
    this.active = false;
  }

  trackById(_: number, message: ChatMessage): string {
    return message.id;
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  send() {
    const text = this.draft.trim();
    if (!text) return;

    const thread = this.thread;
    this.appState.addMessage(thread, 'user', text);
    this.draft = '';
    this.refreshMessages();

    // The host "types" for a moment, then answers.
    this.typing.set(true);
    this.scrollToBottom();
    setTimeout(() => {
      const watching = this.active && thread === this.thread;
      this.appState.addMessage(thread, 'host', this.replyFor(text), { notify: !watching });
      if (watching) {
        this.appState.markThreadRead(thread);
      }
      if (thread === this.thread) {
        this.typing.set(false);
        this.refreshMessages();
      }
    }, 1200);
  }

  // ---------- Internals ----------

  private load(navState: unknown): void {
    const state = (navState ?? {}) as { destinationName?: string; image?: string; afterPayment?: boolean };

    // Chats are opened from the inbox or from a place's details page.
    if (!state.destinationName) {
      this.router.navigate(['/message'], { replaceUrl: true });
      return;
    }

    this.thread = state.destinationName;
    this.title.set(this.thread);
    this.afterPayment.set(!!state.afterPayment);
    this.typing.set(false);
    if (state.image) {
      this.appState.setThreadImage(this.thread, state.image);
    }

    // First visit to a conversation starts with a greeting from the host.
    if (this.appState.getMessages(this.thread).length === 0 && this.appState.isLoggedIn) {
      this.appState.addMessage(
        this.thread,
        'host',
        `Hi! Thanks for your interest in ${this.thread}. Ask us anything about your stay.`,
      );
    }

    // Opened from the confirmation screen: the host acknowledges the booking once.
    if (state.afterPayment) {
      const note =
        'Your payment was received and your booking is confirmed. Message us if you need anything before arrival.';
      if (!this.appState.getMessages(this.thread).some((m) => m.text === note)) {
        this.appState.addMessage(this.thread, 'host', note);
      }
    }

    this.appState.markThreadRead(this.thread);
    this.refreshMessages();
  }

  private refreshMessages(): void {
    this.messages.set(this.appState.getMessages(this.thread));
    this.scrollToBottom();
  }

  private replyFor(text: string): string {
    return AUTO_REPLIES.find((r) => r.match.test(text))?.reply ?? FALLBACK_REPLY;
  }

  private scrollToBottom(): void {
    afterNextRender(
      () => {
        const el = this.scroller?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      },
      { injector: this.injector },
    );
  }
}