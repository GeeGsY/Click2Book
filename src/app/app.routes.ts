import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'destination-details',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./destination-details/destination-details.page').then((m) => m.DestinationDetailsPage),
  },
  {
    path: 'booking',
    canActivate: [authGuard],
    loadComponent: () => import('./booking/booking.page').then((m) => m.BookingPage),
  },
  {
    path: 'payment',
    canActivate: [authGuard],
    loadComponent: () => import('./payment/payment.page').then((m) => m.PaymentPage),
  },
  {
    path: 'afterpay',
    canActivate: [authGuard],
    loadComponent: () => import('./afterpay/afterpay.page').then((m) => m.AfterpayPage),
  },
  {
    path: 'message',
    canActivate: [authGuard],
    loadComponent: () => import('./message/message.page').then((m) => m.MessagePage),
  },
  {
    path: 'user-setting',
    canActivate: [authGuard],
    loadComponent: () => import('./user-setting/user-setting.page').then((m) => m.UserSettingPage),
  },
];