import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Click2BookProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  get supabase(): SupabaseClient {
    return this.client;
  }

  async getProfile(userId: string): Promise<Click2BookProfile> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, email, full_name, phone, role')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data as Click2BookProfile;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw error;
    }

    const profile = await this.getProfile(data.user.id);

    return { user: data.user, profile };
  }

  async signUp(
    name: string,
    email: string,
    password: string,
  ) {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async resetPassword(email: string): Promise<void> {
    // The link in the email opens the app's "Set a new password" page.
    // This address must also be listed under Redirect URLs in the Supabase dashboard.
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();

    if (error) {
      if (error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }

    return data.user;
  }
}