import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, pattern, required, validate } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { Client } from '../../../../shared/models/client.model';
import { Item } from '../../../../shared/models/item.model';
import {
  asValidationError,
  numberError,
  parseNumber,
  round2,
} from '../../../../shared/utils/number-rules';
import { BillsService } from '../../services/bills.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { ItemsService } from '../../../items/services/items.service';

interface InvoiceLine {
  itemId: number;
  itemCode: number;
  itemName: string;
  unitName: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  total: number;
}

function todayLocal(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const newEntryModel = () => ({
  itemId: '',
  sellingPrice: '',
  quantity: '',
  discount: '0',
});

const newInvoiceModel = () => ({
  billDate: todayLocal(),
  clientId: '',
  percentDiscount: '0',
  valueDiscount: '0',
  paidUp: '0',
  employeeName: '',
  requestDate: todayLocal(),
  startTime: '',
  endTime: '',
});

@Component({
  selector: 'app-invoice-create',
  imports: [DecimalPipe, FormField, FormRoot, MatIconModule],
  templateUrl: './invoice-create.component.html',
})
export class InvoiceCreateComponent {
  private readonly billsService = inject(BillsService);
  private readonly clientsService = inject(ClientsService);
  private readonly itemsService = inject(ItemsService);

  // lookups
  protected readonly clients = signal<Client[]>([]);
  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  // page state
  protected readonly lines = signal<InvoiceLine[]>([]);
  protected readonly linesError = signal<string | null>(null);
  protected readonly serverError = signal<string | null>(null);
  protected readonly savedBillNumber = signal<number | null>(null);

  private readonly entryModel = signal(newEntryModel());
  private readonly invoiceModel = signal(newInvoiceModel());

  protected readonly selectedItem = computed(() =>
    this.items().find((i) => String(i.code) === this.entryModel().itemId),
  );

  protected readonly entryTotal = computed(() => {
    const e = this.entryModel();
    return round2(parseNumber(e.sellingPrice) * parseNumber(e.quantity));
  });

  protected readonly billsTotal = computed(() =>
    round2(this.lines().reduce((sum, line) => sum + line.total, 0)),
  );

  protected readonly net = computed(() => {
    const m = this.invoiceModel();
    const total = this.billsTotal();
    return round2(
      total - (total * parseNumber(m.percentDiscount)) / 100 - parseNumber(m.valueDiscount),
    );
  });

  protected readonly rest = computed(() =>
    round2(this.net() - parseNumber(this.invoiceModel().paidUp)),
  );

  protected readonly entryForm = form(this.entryModel, (path) => {
    required(path.itemId, { message: 'ITEM NAME is Required' });

    validate(path.sellingPrice, ({ value }) =>
      asValidationError(numberError('Selling Price', value(), { required: true })),
    );

    validate(path.quantity, ({ value }) =>
      asValidationError(numberError('Quantity', value(), { required: true, positive: true })),
    );

    validate(path.discount, ({ value, valueOf }) => {
      const message = numberError('Discount', value());
      if (message) return asValidationError(message);

      const price = valueOf(path.sellingPrice);
      const quantity = valueOf(path.quantity);
      const priceOk = numberError('Selling Price', price, { required: true }) === null;
      const quantityOk =
        numberError('Quantity', quantity, { required: true, positive: true }) === null;

      if (
        priceOk &&
        quantityOk &&
        parseNumber(value()) > parseNumber(price) * parseNumber(quantity)
      ) {
        return asValidationError('Item discount cannot exceed the item total');
      }
      return null;
    });
  });

  protected readonly invoiceForm = form(
    this.invoiceModel,
    (path) => {
      required(path.billDate, { message: 'BILL DATE is Required' });
      required(path.clientId, { message: 'CLIENT NAME is Required' });
      validate(path.percentDiscount, ({ value }) =>
        asValidationError(numberError('Percentage discount', value(), { max: 100 })),
      );
      validate(path.valueDiscount, ({ value }) => {
        const message = numberError('Value discount', value());
        if (message) return asValidationError(message);
        if (this.lines().length > 0 && this.net() < 0) {
          return asValidationError('Discounts cannot exceed the bill total');
        }
        return null;
      });
      validate(path.paidUp, ({ value }) => asValidationError(numberError('Paid Up', value())));
      required(path.employeeName, { message: 'Employee NAME is Required' });
      pattern(path.employeeName, /\S/, { message: 'Employee NAME is Required' });
      required(path.requestDate, { message: 'DATE is Required' });
      required(path.startTime, { message: 'Start Time is Required' });
      required(path.endTime, { message: 'End Time is Required' });
      validate(path.endTime, ({ value, valueOf }) => {
        const start = valueOf(path.startTime);
        if (value() !== '' && start !== '' && value() <= start) {
          return asValidationError('End Time must be greater than Start Time');
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);
          this.savedBillNumber.set(null);

          if (this.lines().length === 0) {
            this.linesError.set('At least one item is required');
            return;
          }

          try {
            const m = this.invoiceModel();

            const created = await this.billsService.create({
              billDate: m.billDate,
              clientId: Number(m.clientId),
              lines: this.lines().map((line) => ({
                itemId: line.itemId,
                quantity: line.quantity,
                sellingPrice: line.sellingPrice,
                discount: line.discount,
              })),
              percentDiscount: parseNumber(m.percentDiscount),
              valueDiscount: parseNumber(m.valueDiscount),
              paidUp: parseNumber(m.paidUp),
              request: {
                employeeName: m.employeeName.trim(),
                requestDate: m.requestDate,
                startTime: m.startTime,
                endTime: m.endTime,
              },
            });

            this.savedBillNumber.set(created.billNumber);
            this.resetPage();
          } catch (e) {
            this.serverError.set(e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      },
    },
  );

  constructor() {
    this.loadLookups();
  }

  protected async loadLookups(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [clients, items] = await Promise.all([
        this.clientsService.list(),
        this.itemsService.list(),
      ]);
      this.clients.set(clients);
      this.items.set(items);
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : 'Failed to load clients and items');
    } finally {
      this.loading.set(false);
    }
  }

  protected onItemChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const item = this.items().find((i) => String(i.code) === id);
    this.entryModel.update((m) => ({ ...m, sellingPrice: item ? String(item.sellingPrice) : '' }));
  }

  protected addLine(): void {
    const entry = this.entryForm;

    entry.itemId().markAsTouched();
    entry.sellingPrice().markAsTouched();
    entry.quantity().markAsTouched();
    entry.discount().markAsTouched();

    if (entry().invalid()) return;

    const m = this.entryModel();
    const item = this.items().find((i) => String(i.code) === m.itemId);
    if (!item) return;

    const quantity = parseNumber(m.quantity);
    const sellingPrice = parseNumber(m.sellingPrice);
    const discount = parseNumber(m.discount);

    this.lines.update((lines) => [
      ...lines,
      {
        itemId: item.code,
        itemCode: item.code,
        itemName: item.name,
        unitName: item.unitName,
        quantity,
        sellingPrice,
        discount,
        total: round2(quantity * sellingPrice - discount),
      },
    ]);

    this.linesError.set(null);
    this.savedBillNumber.set(null);
    this.entryModel.set(newEntryModel());
    entry().reset();
  }

  protected removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  protected onEntryEnter(event: Event): void {
    if ((event.target as HTMLElement).tagName === 'INPUT') {
      event.preventDefault();
      this.addLine();
    }
  }

  protected blockEnterSubmit(event: Event): void {
    if ((event.target as HTMLElement).tagName === 'INPUT') {
      event.preventDefault();
    }
  }

  private resetPage(): void {
    this.lines.set([]);
    this.linesError.set(null);
    this.entryModel.set(newEntryModel());
    this.invoiceModel.set(newInvoiceModel());
    this.entryForm().reset();
    this.invoiceForm().reset();
  }

  protected fieldClass(hasError: boolean): string {
    return `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
      hasError ? 'border-red-500' : 'border-slate-300'
    }`;
  }

  protected readonly readonlyClass =
    'mt-1 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600';
}
