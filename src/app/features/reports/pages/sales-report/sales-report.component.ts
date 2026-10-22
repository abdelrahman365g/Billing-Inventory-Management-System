import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, validate } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BillSummary } from '../../../../shared/models/bill.model';
import { Client } from '../../../../shared/models/client.model';
import { Item } from '../../../../shared/models/item.model';
import { monthStartLocal, todayLocal } from '../../../../shared/utils/date-helpers';
import { asValidationError, round2 } from '../../../../shared/utils/number-rules';
import {
  BillDetailsDialogComponent,
  BillDetailsDialogData,
} from '../../components/bill-details-dialog/bill-details-dialog.component';
import { BillsService } from '../../../invoices/services/bills.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { ItemsService } from '../../../items/services/items.service';

const defaultFilter = () => ({
  startDate: monthStartLocal(),
  endDate: todayLocal(),
  clientId: '',
  itemId: '',
});

@Component({
  selector: 'app-sales-report',
  imports: [DatePipe, DecimalPipe, FormField, FormRoot, MatIconModule],
  templateUrl: './sales-report.component.html',
})
export class SalesReportComponent {
  private readonly billsService = inject(BillsService);
  private readonly clientsService = inject(ClientsService);
  private readonly itemsService = inject(ItemsService);
  private readonly dialog = inject(MatDialog);

  protected readonly clients = signal<Client[]>([]);
  protected readonly items = signal<Item[]>([]);

  protected readonly bills = signal<BillSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly totals = computed(() => {
    const bills = this.bills();
    return {
      count: bills.length,
      net: round2(bills.reduce((sum, b) => sum + b.net, 0)),
      paid: round2(bills.reduce((sum, b) => sum + b.paidUp, 0)),
      rest: round2(bills.reduce((sum, b) => sum + b.rest, 0)),
    };
  });

  private readonly model = signal(defaultFilter());

  protected readonly filterForm = form(
    this.model,
    (path) => {
      validate(path.endDate, ({ value, valueOf }) => {
        const start = valueOf(path.startDate);
        if (value() !== '' && start !== '' && value() < start) {
          return asValidationError('End date must be on or after the start date');
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          await this.search();
        },
      },
    },
  );

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const lookups = this.loadLookups();
    await Promise.all([lookups, this.search()]);
  }

  private async loadLookups(): Promise<void> {
    try {
      const [clients, items] = await Promise.all([
        this.clientsService.list(),
        this.itemsService.list(),
      ]);
      this.clients.set(clients);
      this.items.set(items);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load clients and items');
    }
  }

  protected async search(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const f = this.model();
      this.bills.set(
        await this.billsService.search({
          from: f.startDate || null,
          to: f.endDate || null,
          clientId: f.clientId ? Number(f.clientId) : null,
          itemId: f.itemId ? Number(f.itemId) : null,
        }),
      );
    } catch (e) {
      this.bills.set([]);
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load bills');
    } finally {
      this.loading.set(false);
    }
  }

  protected async resetFilters(): Promise<void> {
    this.model.set(defaultFilter());
    this.filterForm().reset();
    await this.search();
  }

  protected openDetails(bill: BillSummary): void {
    this.dialog.open<BillDetailsDialogComponent, BillDetailsDialogData>(
      BillDetailsDialogComponent,
      {
        data: { billId: bill.id, billNumber: bill.number },
        width: '56rem',
        maxWidth: '95vw',
      },
    );
  }

  protected fieldClass(hasError: boolean): string {
    return `mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
      hasError ? 'border-red-500' : 'border-slate-300'
    }`;
  }
}
