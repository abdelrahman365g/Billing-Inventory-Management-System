import { computed, Service, signal } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { Supabase } from './supabase';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Service()
export class Auth {
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  private readonly _user = signal<User | undefined>(undefined);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed<boolean>(()=> this._user() != undefined);
  readonly isLoading = signal(false);
  readonly whenready: Promise<void>;

  constructor() {
    this.whenready = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    this.isLoading.set(true);
    const { data } = await this.supabase.client.auth.getSession();
    this._user.set(data.session?.user);
    this.isLoading.set(false);
  }

  async login(email: string, password: string): Promise<{ error: string | null }> {
    this.isLoading.set(true);
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (!data || error) {
      return { error: 'Please enter valid credentials' };
    }
    this._user.set(data.user);
    this.isLoading.set(false);
    return { error: null };
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this._user.set(undefined);
    await this.router.navigate(['/auth/login']);
  }
}
