import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  action: () => Promise<void>;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async confirm(): Promise<void> {
    this.busy.set(true);
    this.errorMessage.set(null);
    this.dialogRef.disableClose = true;

    try {
      await this.data.action();
      this.dialogRef.close(true);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      this.busy.set(false);
      this.dialogRef.disableClose = false;
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
