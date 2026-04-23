import { Injectable } from '@angular/core';
import { AuthChangeEvent, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Profile {
  id?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  updated_at?: string;
}

export interface Student {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  class?: string | null;
  created_at?: string;
  created_by?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  signUp(email: string, password: string, fullName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  getProfile(userId: string) {
    return this.supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, website, updated_at')
      .eq('id', userId)
      .single();
  }

  updateProfile(profile: Profile) {
    return this.supabase.from('profiles').upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    });
  }

  getStudents() {
    return this.supabase
      .from('students')
      .select('id, name, email, phone, birth_date, class, created_at')
      .order('name', { ascending: true });
  }

  createStudent(student: Omit<Student, 'id' | 'created_at' | 'created_by'>) {
    return this.supabase.from('students').insert(student).select().single();
  }

  updateStudent(id: string, student: Omit<Student, 'id' | 'created_at' | 'created_by'>) {
    return this.supabase.from('students').update(student).eq('id', id).select().single();
  }

  deleteStudent(id: string) {
    return this.supabase.from('students').delete().eq('id', id);
  }
}
