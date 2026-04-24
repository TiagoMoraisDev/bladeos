import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalDay {
  date: string;
  day: number;
  currentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const WEEK_DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent {
  readonly value = input<string>('');
  readonly maxDate = input<string>(new Date().toISOString().split('T')[0]);
  readonly valueChange = output<string>();

  open = signal(false);

  private now = new Date();
  viewYear = signal(this.now.getFullYear());
  viewMonth = signal(this.now.getMonth());

  readonly weekDays = WEEK_DAYS;

  readonly monthLabel = computed(
    () => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`,
  );

  readonly calendarDays = computed<CalDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const selected = this.value();
    const max = this.maxDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0
    const start = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        day: d.getDate(),
        currentMonth: d.getMonth() === month,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selected,
        isDisabled: !!max && dateStr > max,
      };
    });
  });

  readonly canGoNext = computed(() => {
    const max = this.maxDate();
    if (!max) return true;
    const [maxY, maxM] = max.split('-').map(Number);
    return this.viewYear() < maxY || (this.viewYear() === maxY && this.viewMonth() < maxM - 1);
  });

  readonly displayValue = computed(() => {
    const v = this.value();
    if (!v) return 'Selecionar...';
    const [year, month, day] = v.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  });

  toggle() {
    if (!this.open()) {
      const v = this.value();
      if (v) {
        const [y, m] = v.split('-').map(Number);
        this.viewYear.set(y);
        this.viewMonth.set(m - 1);
      }
    }
    this.open.update(v => !v);
  }

  prevMonth() {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth() {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  selectDay(day: CalDay) {
    if (day.isDisabled) return;
    this.valueChange.emit(day.date);
    this.open.set(false);
  }
}
