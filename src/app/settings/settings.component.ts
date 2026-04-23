import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../shared/nav.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NavComponent, RouterLink],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {}
