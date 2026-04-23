import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'alunos', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'alunos',
    loadComponent: () => import('./students/students.component').then(m => m.StudentsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'turmas',
    loadComponent: () => import('./classes/classes.component').then(m => m.ClassesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'account',
    loadComponent: () => import('./account/account.component').then(m => m.AccountComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'alunos' },
];
