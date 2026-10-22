import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';

export async function confirmDelete(
  dialog: MatDialog,
  options: { title: string; message: string; action: () => Promise<void> },
): Promise<boolean> {
  const ref = dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
    ConfirmDialogComponent,
    {
      data: { ...options, confirmLabel: 'Delete' },
      width: '26rem',
      maxWidth: '95vw',
    },
  );

  return (await firstValueFrom(ref.afterClosed())) === true;
}
