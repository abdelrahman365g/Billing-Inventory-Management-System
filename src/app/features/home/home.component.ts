import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Dashboard, DashboardBill } from '../../shared/models/dashboard.model';
import {
  BillDetailsDialogComponent,
  BillDetailsDialogData,
} from '../reports/components/bill-details-dialog/bill-details-dialog.component';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-home',
  imports: [DatePipe, DecimalPipe, RouterLink, MatIconModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly dialog = inject(MatDialog);

  protected readonly now = new Date();
  protected readonly thisMonth = this.now;

  protected readonly greeting = (() => {
    const hour = this.now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  protected readonly data = signal<Dashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  // bar heights as a percentage of the best month
  protected readonly bars = computed(() => {
    const monthly = this.data()?.monthly ?? [];
    const max = Math.max(1, ...monthly.map((m) => m.net));
    return monthly.map((m) => ({
      ...m,
      height: m.net > 0 ? Math.max(4, Math.round((m.net / max) * 100)) : 0,
    }));
  });

  protected readonly hasAnyBills = computed(() => {
    const d = this.data();
    return !!d && (d.recent.length > 0 || d.monthly.some((m) => m.bills > 0));
  });

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.data.set(await this.dashboardService.get());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load the dashboard');
    } finally {
      this.loading.set(false);
    }
  }

  protected openBill(bill: DashboardBill): void {
    this.dialog.open<BillDetailsDialogComponent, BillDetailsDialogData>(
      BillDetailsDialogComponent,
      {
        data: { billId: bill.id, billNumber: bill.number },
        width: '56rem',
        maxWidth: '95vw',
      },
    );
  }
}
