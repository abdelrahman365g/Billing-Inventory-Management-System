import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { Payment, UnpaidBill } from '../../../../shared/models/payment.model';
import { todayLocal } from '../../../../shared/utils/date-helpers';
import {
  asValidationError,
  numberError,
  parseNumber,
  round2,
} from '../../../../shared/utils/number-rules';
import { PaymentsService } from '../../services/payments.service';

const newModel = () => ({
  clientId: '',
  billId: '',
  amount: '',
  paymentDate: todayLocal(),
  note: '',
});

@Component({
  selector: 'app-payment-create',
  imports: [DatePipe, DecimalPipe, FormField, FormRoot, MatIconModule],
  templateUrl: './payment-create.component.html',
})
export class PaymentCreateComponent {
  private readonly paymentsService = inject(PaymentsService);

  protected readonly unpaid = signal<UnpaidBill[]>([]);
  protected readonly recent = signal<Payment[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly serverError = signal<string | null>(null);
  protected readonly saved = signal<{ number: number; amount: number } | null>(null);

  private readonly model = signal(newModel());

  protected readonly clients = computed(() => {
    const byId = new Map<number, string>();
    for (const bill of this.unpaid()) byId.set(bill.clientId, bill.clientName);
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly bills = computed(() => {
    const clientId = this.model().clientId;
    return clientId === ''
      ? this.unpaid()
      : this.unpaid().filter((b) => String(b.clientId) === clientId);
  });

  protected readonly selectedBill = computed(() =>
    this.unpaid().find((b) => String(b.id) === this.model().billId),
  );

  protected readonly restAfter = computed(() => {
    const bill = this.selectedBill();
    return bill ? round2(bill.rest - parseNumber(this.model().amount)) : 0;
  });

  protected readonly paymentForm = form(
    this.model,
    (path) => {
      required(path.billId, { message: 'BILL is Required' });

      validate(path.amount, ({ value }) => {
        const message = numberError('Amount', value(), { required: true, positive: true });
        if (message) return asValidationError(message);

        const bill = this.selectedBill();
        if (bill && parseNumber(value()) > bill.rest) {
          return asValidationError('Amount cannot exceed the remaining balance of the bill');
        }
        return null;
      });

      required(path.paymentDate, { message: 'DATE is Required' });
      validate(path.paymentDate, ({ value }) => {
        const bill = this.selectedBill();
        if (bill && value() !== '' && value() < bill.date) {
          return asValidationError('DATE cannot be before the bill date');
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);
          this.saved.set(null);

          try {
            const m = this.model();
            const amount = parseNumber(m.amount);

            const created = await this.paymentsService.create({
              billId: Number(m.billId),
              amount,
              paymentDate: m.paymentDate,
              note: m.note.trim() || null,
            });

            this.saved.set({ number: created.paymentNumber, amount });
            this.model.update((x) => ({ ...x, amount: '', note: '' }));
            this.paymentForm().reset();
            await this.loadData();
          } catch (e) {
            this.serverError.set(e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      },
    },
  );

  constructor() {
    this.init();
  }

  protected async init(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      await this.loadData();
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : 'Failed to load unpaid bills');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadData(): Promise<void> {
    const [unpaid, recent] = await Promise.all([
      this.paymentsService.unpaidBills(),
      this.paymentsService.recent(),
    ]);
    this.unpaid.set(unpaid);
    this.recent.set(recent);
    this.selectDefaultBill();
  }

  // keep the current bill while it still has a rest, otherwise fall back to the oldest one
  private selectDefaultBill(): void {
    const current = this.model();

    let clientId = current.clientId;
    if (clientId !== '' && !this.unpaid().some((b) => String(b.clientId) === clientId)) {
      clientId = '';
    }

    const candidates = this.unpaid().filter(
      (b) => clientId === '' || String(b.clientId) === clientId,
    );
    const keep = candidates.some((b) => String(b.id) === current.billId);

    this.model.update((m) => ({
      ...m,
      clientId,
      billId: keep ? current.billId : candidates[0] ? String(candidates[0].id) : '',
    }));
  }

  // changing the client filter jumps to that client's oldest unpaid bill
  protected onClientChange(event: Event): void {
    const clientId = (event.target as HTMLSelectElement).value;
    const first = this.unpaid().find((b) => clientId === '' || String(b.clientId) === clientId);

    this.model.update((m) => ({ ...m, clientId, billId: first ? String(first.id) : '' }));
  }

  protected payFullRest(): void {
    const bill = this.selectedBill();
    if (bill) {
      this.model.update((m) => ({ ...m, amount: String(bill.rest) }));
    }
  }

  protected fieldClass(hasError: boolean): string {
    return `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
      hasError ? 'border-red-500' : 'border-slate-300'
    }`;
  }

  protected readonly readonlyClass =
    'mt-1 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600';
}
