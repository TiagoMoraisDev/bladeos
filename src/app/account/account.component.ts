import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile, SupabaseService } from '../services/supabase.service';
import { NavComponent } from '../shared/nav.component';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  user: User | null = null;
  profile: Profile = {};

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.user = await this.supabase.getUser();
      if (this.user) {
        const { data, error } = await this.supabase.getProfile(this.user.id);
        if (error) throw error;
        if (data) this.profile = data;
      }
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao carregar perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile() {
    if (!this.user) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);

    try {
      const { error } = await this.supabase.updateProfile({ ...this.profile, id: this.user.id });
      if (error) throw error;
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao salvar perfil.');
    } finally {
      this.saving.set(false);
    }
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
