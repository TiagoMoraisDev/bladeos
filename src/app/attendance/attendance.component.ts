import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Attendance, Student, Turma, SupabaseService } from '../services/supabase.service';
import { NavComponent } from '../shared/nav.component';

interface AttendanceRow {
  student: Student;
  status: 0 | 1 | 2;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent],
  templateUrl: './attendance.component.html',
})
export class AttendanceComponent implements OnInit {
  turmas = signal<Turma[]>([]);
  rows = signal<AttendanceRow[]>([]);

  selectedDate = this.todayStr();
  selectedClassId = '';

  loading = signal(false);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  saveError = signal<string | null>(null);

  get isToday(): boolean {
    return this.selectedDate === this.todayStr();
  }

  get selectedTurma(): Turma | null {
    return this.turmas().find(t => t.id === this.selectedClassId) ?? null;
  }

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data } = await this.supabase.getClasses();
    this.turmas.set(data ?? []);
  }

  async onFilterChange() {
    const date = this.selectedDate;
    const classId = this.selectedClassId;
    if (!date || !classId) {
      this.rows.set([]);
      return;
    }
    await this.loadAttendance(date, classId);
  }

  private async loadAttendance(date: string, classId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        this.supabase.getStudentsByClass(classId),
        this.supabase.getAttendance(date, classId),
      ]);

      if (studentsRes.error) throw studentsRes.error;

      const existingMap = new Map<string, 0 | 1 | 2>();
      for (const a of attendanceRes.data ?? []) {
        existingMap.set(a.student_id, a.status as 0 | 1 | 2);
      }

      this.rows.set(
        (studentsRes.data ?? []).map(student => ({
          student,
          status: existingMap.get(student.id!) ?? 0,
        })),
      );
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao carregar frequência.');
    } finally {
      this.loading.set(false);
    }
  }

  cycleStatus(row: AttendanceRow) {
    const next = ((row.status + 1) % 3) as 0 | 1 | 2;
    this.rows.update(rows =>
      rows.map(r => (r.student.id === row.student.id ? { ...r, status: next } : r)),
    );
  }

  async save() {
    const date = this.selectedDate;
    const turma = this.selectedTurma;
    if (!date || !turma) return;

    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(null);

    try {
      const records: Omit<Attendance, 'id' | 'created_by'>[] = this.rows().map(r => ({
        date,
        student_id: r.student.id!,
        student_name: r.student.name,
        class_id: turma.id!,
        class_name: turma.name,
        status: r.status,
      }));

      const { error } = await this.supabase.upsertAttendance(records);
      if (error) throw error;
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (err: any) {
      this.saveError.set(err.message ?? 'Erro ao salvar frequência.');
    } finally {
      this.saving.set(false);
    }
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
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
