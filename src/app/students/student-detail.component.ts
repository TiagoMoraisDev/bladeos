import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  avatar_url: null,
});

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [NavComponent, RouterLink, FormsModule],
  templateUrl: './student-detail.component.html',
})
export class StudentDetailComponent implements OnInit {
  student = signal<Student | null>(null);
  turmas = signal<Turma[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  present = signal(0);
  absent = signal(0);
  justified = signal(0);

  showModal = signal(false);
  saving = signal(false);
  modalError = signal<string | null>(null);
  form: StudentForm = emptyForm();
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  private studentId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/alunos']);
      return;
    }
    this.studentId = id;
    await Promise.all([this.loadData(), this.loadTurmas()]);
  }

  private async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [studentRes, attendanceRes] = await Promise.all([
        this.supabase.getStudentById(this.studentId),
        this.supabase.getAttendanceByStudent(this.studentId),
      ]);

      if (studentRes.error) throw studentRes.error;
      this.student.set(studentRes.data);

      const records = attendanceRes.data ?? [];
      this.present.set(records.filter(r => r.status === 1).length);
      this.absent.set(records.filter(r => r.status === 0).length);
      this.justified.set(records.filter(r => r.status === 2).length);
    } catch (err: any) {
      this.error.set(err.message ?? 'Erro ao carregar dados do aluno.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTurmas() {
    const { data } = await this.supabase.getClasses();
    this.turmas.set(data ?? []);
  }

  openModal() {
    const s = this.student();
    if (!s) return;
    this.modalError.set(null);
    this.avatarFile.set(null);
    this.avatarPreview.set(s.avatar_url ?? null);
    this.form = {
      name: s.name,
      email: s.email ?? null,
      phone: s.phone ?? null,
      birth_date: s.birth_date ?? null,
      class: s.class ?? null,
      class_id: s.class_id ?? null,
      avatar_url: s.avatar_url ?? null,
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
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
    if (!this.form.class_id) {
      this.modalError.set('Selecione uma turma para o aluno.');
      return;
    }

    this.saving.set(true);
    this.modalError.set(null);

    try {
      if (this.avatarFile()) {
        this.form.avatar_url = await this.supabase.uploadStudentAvatar(
          this.studentId,
          this.avatarFile()!,
        );
      }
      const { error } = await this.supabase.updateStudent(this.studentId, this.form);
      if (error) throw error;
      this.closeModal();
      await this.loadData();
    } catch (err: any) {
      this.modalError.set(err.message ?? 'Erro ao salvar aluno.');
    } finally {
      this.saving.set(false);
    }
  }

  calcAge(birthDate: string | null | undefined): string {
    if (!birthDate) return '—';
    const today = new Date();
    const birth = new Date(birthDate + 'T00:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age + ' anos';
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

  get totalClasses(): number {
    return this.present() + this.absent() + this.justified();
  }

  get attendanceRate(): number {
    const total = this.totalClasses;
    if (total === 0) return 0;
    return Math.round(((this.present() + this.justified()) / total) * 100);
  }
}
