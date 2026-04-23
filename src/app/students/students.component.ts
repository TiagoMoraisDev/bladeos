import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Student, Turma, SupabaseService } from '../services/supabase.service';
import { NavComponent } from '../shared/nav.component';

type StudentForm = Omit<Student, 'id' | 'created_at' | 'created_by'>;

const emptyForm = (): StudentForm => ({
  name: '',
  email: null,
  phone: null,
  birth_date: null,
  class: null,
  class_id: null,
});

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, RouterLink],
  templateUrl: './students.component.html',
})
export class StudentsComponent implements OnInit {
  students = signal<Student[]>([]);
  turmas = signal<Turma[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  modalError = signal<string | null>(null);

  editingId = signal<string | null>(null);
  form: StudentForm = emptyForm();

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await Promise.all([this.loadStudents(), this.loadTurmas()]);
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

  async loadTurmas() {
    const { data } = await this.supabase.getClasses();
    this.turmas.set(data ?? []);
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
        class_id: student.class_id ?? null,
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

  selectTurma(turma: Turma) {
    if (this.form.class_id === turma.id) {
      this.form.class_id = null;
      this.form.class = null;
    } else {
      this.form.class_id = turma.id ?? null;
      this.form.class = turma.name;
    }
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

  formatDays(days: string[]): string {
    const map: Record<string, string> = {
      seg: 'Seg', ter: 'Ter', qua: 'Qua',
      qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
    };
    return days?.map(d => map[d] ?? d).join(', ') ?? '';
  }

  formatTime(time: string): string {
    return time?.substring(0, 5) ?? '';
  }
}
