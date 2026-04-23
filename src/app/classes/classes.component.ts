import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Turma, SupabaseService } from '../services/supabase.service';
import { NavComponent } from '../shared/nav.component';

type TurmaForm = Omit<Turma, 'id' | 'created_at' | 'created_by'>;

const DAYS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const emptyForm = (): TurmaForm => ({
  name: '',
  days: [],
  start_time: '',
  end_time: '',
});

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, RouterLink],
  templateUrl: './classes.component.html',
})
export class ClassesComponent implements OnInit {
  readonly allDays = DAYS;

  classes = signal<Turma[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  modalError = signal<string | null>(null);

  editingId = signal<string | null>(null);
  form: TurmaForm = emptyForm();

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadClasses();
  }

  async loadClasses() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.getClasses();
      if (error) throw error;
      this.classes.set(data ?? []);
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao carregar turmas.');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(turma?: Turma) {
    this.modalError.set(null);
    if (turma) {
      this.editingId.set(turma.id ?? null);
      this.form = {
        name: turma.name,
        days: [...turma.days],
        start_time: turma.start_time,
        end_time: turma.end_time,
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

  toggleDay(key: string) {
    const idx = this.form.days.indexOf(key);
    if (idx >= 0) {
      this.form.days = this.form.days.filter(d => d !== key);
    } else {
      const order = DAYS.map(d => d.key);
      this.form.days = [...this.form.days, key].sort(
        (a, b) => order.indexOf(a) - order.indexOf(b),
      );
    }
  }

  isDaySelected(key: string): boolean {
    return this.form.days.includes(key);
  }

  async saveClass() {
    if (!this.form.name.trim()) {
      this.modalError.set('O nome da turma é obrigatório.');
      return;
    }
    if (this.form.days.length === 0) {
      this.modalError.set('Selecione ao menos um dia da semana.');
      return;
    }
    if (!this.form.start_time || !this.form.end_time) {
      this.modalError.set('Informe os horários de início e término.');
      return;
    }

    this.saving.set(true);
    this.modalError.set(null);

    try {
      const id = this.editingId();
      if (id) {
        const { error } = await this.supabase.updateClass(id, this.form);
        if (error) throw error;
      } else {
        const { error } = await this.supabase.createClass(this.form);
        if (error) throw error;
      }
      this.closeModal();
      await this.loadClasses();
    } catch (err: any) {
      this.modalError.set(err.message ?? 'Erro ao salvar turma.');
    } finally {
      this.saving.set(false);
    }
  }

  formatDays(days: string[]): string {
    if (!days?.length) return '—';
    const map: Record<string, string> = {
      seg: 'Seg', ter: 'Ter', qua: 'Qua',
      qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
    };
    return days.map(d => map[d] ?? d).join(', ');
  }

  formatTime(time: string): string {
    if (!time) return '—';
    return time.substring(0, 5);
  }
}
