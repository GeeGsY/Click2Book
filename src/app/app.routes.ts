import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    // Opening the app always starts at the Login page.
    path: '',
    redirectTo: 'login',
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
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notifications/notifications.page').then((m) => m.NotificationsPage),
  },
  {
    path: 'edit-profile',
    canActivate: [authGuard],
    loadComponent: () => import('./edit-profile/edit-profile.page').then((m) => m.EditProfilePage),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'payment-methods',
    canActivate: [authGuard],
    loadComponent: () => import('./payment-methods/payment-methods.page').then((m) => m.PaymentMethodsPage),
  },
  {
    path: 'bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./bookings/bookings.page').then((m) => m.BookingsPage),
  },
  {
    path: 'saved',
    canActivate: [authGuard],
    loadComponent: () => import('./saved/saved.page').then((m) => m.SavedPage),
  },
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () => import('./help/help.page').then((m) => m.HelpPage),
  },
  {
    path: 'privacy',
    canActivate: [authGuard],
    loadComponent: () => import('./privacy/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'admin-places',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-places/admin-places.page').then((m) => m.AdminPlacesPage),
  },
  {
    path: 'admin-place-form',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-place-form/admin-place-form.page').then((m) => m.AdminPlaceFormPage),
  },
  {
    path: 'admin-bookings',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-bookings/admin-bookings.page').then((m) => m.AdminBookingsPage),
  },
  {
    path: 'user-setting',
    canActivate: [authGuard],
    loadComponent: () => import('./user-setting/user-setting.page').then((m) => m.UserSettingPage),
  },
  {
    path: 'edit-profile',
    loadComponent: () => import('./edit-profile/edit-profile.page').then( m => m.EditProfilePage)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password.page').then( m => m.ChangePasswordPage)
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./payment-methods/payment-methods.page').then( m => m.PaymentMethodsPage)
  },
  {
    path: 'bookings',
    loadComponent: () => import('./bookings/bookings.page').then( m => m.BookingsPage)
  },
  {
    path: 'saved',
    loadComponent: () => import('./saved/saved.page').then( m => m.SavedPage)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy.page').then( m => m.PrivacyPage)
  },
  {
    path: 'helps',
    loadComponent: () => import('./help/help.page').then((m) => m.HelpPage),
  },
];