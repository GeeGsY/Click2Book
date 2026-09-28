import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ],
})
export class LoginPage {

  email: string = '';
  password: string = '';

  constructor() {}

  onLogin() {
    // TODO: wire up to your auth service / API call
    console.log('Login attempt:', this.email, this.password);
  }

  onForgotPassword() {
    // TODO: navigate to forgot-password page
  }

  onSignUp() {
    // TODO: navigate to sign-up page
  }

}
