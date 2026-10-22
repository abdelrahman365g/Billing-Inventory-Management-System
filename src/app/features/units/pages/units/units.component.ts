import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { Unit } from '../../../../shared/models/unit.model';
import {
  UnitDialogComponent,
  UnitDialogData,
} from '../../components/unit-dialog/unit-dialog.component';
import { UnitsService } from '../../services/units.service';
import { confirmDelete } from '../../../../shared/utils/confirm-delete';

@Component({
  selector: 'app-units',
  imports: [MatIconModule],
  templateUrl: './units.component.html',
})
export class UnitsComponent {
  private readonly unitsService = inject(UnitsService);
  private readonly dialog = inject(MatDialog);

  protected readonly units = signal<Unit[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.units.set(await this.unitsService.list());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load units');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openDialog(unit?: Unit): Promise<void> {
    const ref = this.dialog.open<UnitDialogComponent, UnitDialogData, boolean>(
      UnitDialogComponent,
      {
        data: { unit },
        width: '28rem',
        maxWidth: '95vw',
      },
    );

    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) {
      await this.load();
    }
  }

  protected async deleteUnit(unit: Unit): Promise<void> {
    const deleted = await confirmDelete(this.dialog, {
      title: 'Delete unit',
      message: `Delete "${unit.name}"? This cannot be undone.`,
      action: () => this.unitsService.delete(unit.id),
    });

    if (deleted) {
      this.units.update((list) => list.filter((u) => u.id !== unit.id));
    }
  }
}
