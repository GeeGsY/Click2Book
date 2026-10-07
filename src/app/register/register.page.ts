import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { location, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class RegisterPage {
  name = '';
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

  async onSignUp() {
    if (this.busy) return;
    this.message = '';
    this.busy = true;

    const result = await this.state.register(this.name, this.email, this.password);
    this.busy = false;

    if (result.ok) {
      this.password = '';
      // A new account is signed in straight away and goes to the home screen.
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      this.message = result.error ?? 'Could not create the account. Please try again.';
    }
  }

  onLogin() {
    this.router.navigate(['/login']);
  }
}