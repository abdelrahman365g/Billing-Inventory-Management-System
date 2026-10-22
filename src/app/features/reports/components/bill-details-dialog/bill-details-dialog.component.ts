import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BillsService } from './../../../invoices/services/bills.service';
import { BillDetail } from '../../../../shared/models/bill.model';

export interface BillDetailsDialogData {
  billId: number;
  billNumber: number;
}

@Component({
  selector: 'app-bill-details-dialog',
  imports: [DatePipe, DecimalPipe, MatIconModule],
  templateUrl: './bill-details-dialog.component.html',
})
export class BillDetailsDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<BillDetailsDialogComponent>>(MatDialogRef);
  private readonly data = inject<BillDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly billsService = inject(BillsService);

  protected readonly billNumber = this.data.billNumber;
  protected readonly bill = signal<BillDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.bill.set(await this.billsService.get(this.data.billId));
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load the bill');
    } finally {
      this.loading.set(false);
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
