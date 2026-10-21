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

  async send(): Promise<void> {
    const text = this.draft.trim();
    if (!text) return;

    const thread = this.thread;
    this.draft = '';
    const message = await this.appState.sendMessage(thread, text);
    if (!message) {
      // It could not be saved: put the text back so nothing is lost.
      this.draft = text;
      this.cdr.markForCheck();
      return;
    }
    this.refreshMessages();

    // The host "types" for a moment, then the answer (created by the database) appears.
    this.typing.set(true);
    this.scrollToBottom();
    setTimeout(async () => {
      await this.appState.refreshMessages();
      const watching = this.active && thread === this.thread;
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

    // Show what is already loaded, then let Supabase mark it read, add the host's greeting
    // the first time (and the booking note after paying) and send the latest messages.
    this.refreshMessages();
    const thread = this.thread;
    void this.appState.openThread(thread, state.image, !!state.afterPayment).then(() => {
      if (thread === this.thread) this.refreshMessages();
    });
  }

  private refreshMessages(): void {
    this.messages.set(this.appState.getMessages(this.thread));
    this.scrollToBottom();
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