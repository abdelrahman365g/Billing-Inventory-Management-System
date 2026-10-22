import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ItemType } from '../../../../shared/models/item-type.model';
import {
  TypeDialogComponent,
  TypeDialogData,
} from '../../components/type-dialog/type-dialog.component';
import { TypesService } from '../../services/types.service';
import { confirmDelete } from '../../../../shared/utils/confirm-delete';

@Component({
  selector: 'app-types',
  imports: [MatIconModule],
  templateUrl: './types.component.html',
})
export class TypesComponent {
  private readonly typesService = inject(TypesService);
  private readonly dialog = inject(MatDialog);

  protected readonly types = signal<ItemType[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.types.set(await this.typesService.list());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load types');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openDialog(type?: ItemType): Promise<void> {
    const ref = this.dialog.open<TypeDialogComponent, TypeDialogData, boolean>(
      TypeDialogComponent,
      {
        data: { type },
        width: '28rem',
        maxWidth: '95vw',
      },
    );

    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) {
      await this.load();
    }
  }

  protected async deleteType(type: ItemType): Promise<void> {
    const deleted = await confirmDelete(this.dialog, {
      title: 'Delete type',
      message: `Delete "${type.name}"? This cannot be undone.`,
      action: () => this.typesService.delete(type.id),
    });

    if (deleted) {
      this.types.update((list) => list.filter((t) => t.id !== type.id));
    }
  }
}
