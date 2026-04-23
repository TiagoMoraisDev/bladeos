import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student, SupabaseService } from '../services/supabase.service';
import { NavComponent } from '../shared/nav.component';

type StudentForm = Omit<Student, 'id' | 'created_at' | 'created_by'>;

const emptyForm = (): StudentForm => ({
  name: '',
  email: null,
  phone: null,
  birth_date: null,
  class: null,
});

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './students.component.html',
})
export class StudentsComponent implements OnInit {
  students = signal<Student[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  modalError = signal<string | null>(null);

  editingId = signal<string | null>(null);
  form: StudentForm = emptyForm();

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadStudents();
  }

  async loadStudents() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.getStudents();
      if (error) throw error;
      this.students.set(data ?? []);
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao carregar alunos.');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(student?: Student) {
    this.modalError.set(null);
    if (student) {
      this.editingId.set(student.id ?? null);
      this.form = {
        name: student.name,
        email: student.email ?? null,
        phone: student.phone ?? null,
        birth_date: student.birth_date ?? null,
        class: student.class ?? null,
      };
    } else {
      this.editingId.set(null);
      this.form = emptyForm();
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveStudent() {
    if (!this.form.name.trim()) {
      this.modalError.set('O nome do aluno é obrigatório.');
      return;
    }

    this.saving.set(true);
    this.modalError.set(null);

    try {
      const id = this.editingId();
      if (id) {
        const { error } = await this.supabase.updateStudent(id, this.form);
        if (error) throw error;
      } else {
        const { error } = await this.supabase.createStudent(this.form);
        if (error) throw error;
      }
      this.closeModal();
      await this.loadStudents();
    } catch (err: any) {
      this.modalError.set(err.message ?? 'Erro ao salvar aluno.');
    } finally {
      this.saving.set(false);
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  }
}
