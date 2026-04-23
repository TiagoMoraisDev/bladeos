import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
})
export class NavComponent {
  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
