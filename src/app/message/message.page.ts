import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, chevronForward } from 'ionicons/icons';
import { AppStateService, ChatThread } from '../services/app-state.service';
import { listTime } from '../utils/time';

@Component({
  selector: 'app-message',
  templateUrl: './message.page.html',
  styleUrls: ['./message.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class MessagePage implements ViewWillEnter {
  private router = inject(Router);
  private appState = inject(AppStateService);

  // A signal, because the app runs without zone.js.
  threads = signal<ChatThread[]>([]);

  constructor() {
    addIcons({ 'chatbubbles-outline': chatbubblesOutline, 'chevron-forward': chevronForward });
    this.refresh();
  }

  // Runs every time the tab is shown, so new messages and read marks appear straight away.
  ionViewWillEnter(): void {
    this.refresh();
  }

  trackById(_: number, thread: ChatThread): string {
    return thread.id;
  }

  open(thread: ChatThread): void {
    this.router.navigate(['/chat'], {
      state: { destinationName: thread.title, image: thread.image },
    });
  }

  name(thread: ChatThread): string {
    return thread.title.split(',')[0];
  }

  place(thread: ChatThread): string {
    return thread.title.split(',').slice(1).join(',').trim();
  }

  initial(thread: ChatThread): string {
    return this.name(thread).charAt(0).toUpperCase();
  }

  preview(thread: ChatThread): string {
    return (thread.last.from === 'user' ? 'You: ' : '') + thread.last.text;
  }

  time(thread: ChatThread): string {
    return listTime(thread.last.sentAt);
  }

  private refresh(): void {
    this.appState.ensureStarterData();
    this.threads.set(this.appState.threads);
  }
}