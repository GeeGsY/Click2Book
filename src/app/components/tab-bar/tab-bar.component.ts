import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home,
  homeOutline,
  chatbubbleEllipses,
  chatbubbleEllipsesOutline,
  person,
  personOutline,
} from 'ionicons/icons';

interface Tab {
  label: string;
  path: string;
  icon: string;
  iconActive: string;
}

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  imports: [CommonModule, IonIcon],
})
export class TabBarComponent {
  // The three main screens. Pages inside a flow (details, booking, payment) are not
  // listed here, so the bar hides itself on them and checkout stays focused.
  tabs: Tab[] = [
    { label: 'Home', path: '/home', icon: 'home-outline', iconActive: 'home' },
    { label: 'Messages', path: '/message', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
    { label: 'Profile', path: '/user-setting', icon: 'person-outline', iconActive: 'person' },
  ];

  // A signal, because the app runs without zone.js and a plain field would not refresh the view.
  private url = signal('');

  visible = computed(() => this.tabs.some((tab) => this.matches(this.url(), tab)));

  constructor(private router: Router, private nav: NavController) {
    addIcons({
      home: home,
      'home-outline': homeOutline,
      'chatbubble-ellipses': chatbubbleEllipses,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      person: person,
      'person-outline': personOutline,
    });

    this.url.set(this.clean(this.router.url));
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(this.clean(e.urlAfterRedirects)));
  }

  isActive(tab: Tab): boolean {
    return this.matches(this.url(), tab);
  }

  go(tab: Tab): void {
    if (this.isActive(tab)) return;
    this.nav.navigateRoot(tab.path);
  }

  private matches(url: string, tab: Tab): boolean {
    return url === tab.path || url.startsWith(tab.path + '/');
  }

  private clean(url: string): string {
    return url.split('?')[0].split('#')[0];
  }
}