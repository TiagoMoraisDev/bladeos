import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  isLogin = signal(true);
  loading = signal(false);
  message = signal<{ text: string; type: 'error' | 'success' } | null>(null);

  email = '';
  password = '';
  fullName = '';

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  toggleMode() {
    this.isLogin.update(v => !v);
    this.message.set(null);
    this.email = '';
    this.password = '';
    this.fullName = '';
  }

  async handleSubmit() {
    this.loading.set(true);
    this.message.set(null);

    try {
      if (this.isLogin()) {
        const { error } = await this.supabase.signIn(this.email, this.password);
        if (error) throw error;
        this.router.navigate(['/account']);
      } else {
        const { error } = await this.supabase.signUp(this.email, this.password, this.fullName);
        if (error) throw error;
        this.message.set({
          text: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.',
          type: 'success',
        });
      }
    } catch (err: any) {
      this.message.set({ text: err.message ?? 'Ocorreu um erro. Tente novamente.', type: 'error' });
    } finally {
      this.loading.set(false);
    }
  }
}
