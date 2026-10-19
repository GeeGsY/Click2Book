import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { location, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class LoginPage {
  // The app runs without zone.js, so changes made after an await or from a
  // lifecycle hook must ask Angular to refresh the view.
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  showPassword = false;
  message = '';
  busy = false;

  constructor(private state: AppStateService, private router: Router) {
    addIcons({
      location: location,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
    });
  }

  async onLogin() {
    if (this.busy) return;
    this.message = '';
    this.busy = true;

    const result = await this.state.login(this.email, this.password);
    this.busy = false;
    this.cdr.markForCheck();

    if (result.ok) {
      this.password = '';
      this.router.navigate([this.state.isAdmin ? '/admin' : '/home'], { replaceUrl: true });
    } else {
      this.message = result.error ?? 'Could not log in. Please try again.';
      this.cdr.markForCheck();
    }
  }

  onForgotPassword() {
    // TODO: password recovery needs a server to send the reset link
    this.message = 'Password recovery is not available in this prototype yet.';
  }

  onSignUp() {
    this.router.navigate(['/register']);
  }
}