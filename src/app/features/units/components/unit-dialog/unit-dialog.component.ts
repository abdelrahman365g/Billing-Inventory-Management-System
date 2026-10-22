import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { Unit } from '../../../../shared/models/unit.model';
import { UnitsService } from '../../services/units.service';

export interface UnitDialogData {
  unit?: Unit;
}

@Component({
  selector: 'app-unit-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './unit-dialog.component.html',
})
export class UnitDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<UnitDialogComponent, boolean>>(MatDialogRef);
  private readonly data = inject<UnitDialogData>(MAT_DIALOG_DATA);
  private readonly unitsService = inject(UnitsService);

  protected readonly isEdit = !!this.data.unit;

  // server-side messages such as "UNIT NAME has already existed before"
  protected readonly serverError = signal<string | null>(null);

  private readonly model = signal({ name: this.data.unit?.name ?? '' });

  protected readonly unitForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'UNIT NAME is Required' });
      pattern(path.name, /\S/, { message: 'UNIT NAME is Required' });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);

          try {
            const name = this.model().name.trim();

            if (this.data.unit) {
              await this.unitsService.update(this.data.unit.id, name);
            } else {
              await this.unitsService.add(name);
            }

            this.dialogRef.close(true);
          } catch (e) {
            this.serverError.set(e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      },
    },
  );

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
