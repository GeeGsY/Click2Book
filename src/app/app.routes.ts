import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'destination-details',
    loadComponent: () => import('./destination-details/destination-details.page').then( m => m.DestinationDetailsPage)
  },
  {
    path: 'booking',
    loadComponent: () => import('./booking/booking.page').then( m => m.BookingPage)
  },
  {
    path: 'payment',
    loadComponent: () => import('./payment/payment.page').then( m => m.PaymentPage)
  },
  {
    path: 'afterpay',
    loadComponent: () => import('./afterpay/afterpay.page').then( m => m.AfterpayPage)
  },
  {
    path: 'message',
    loadComponent: () => import('./message/message.page').then( m => m.MessagePage)
  },
  {
    path: 'user-setting',
    loadComponent: () => import('./user-setting/user-setting.page').then( m => m.UserSettingPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
];
