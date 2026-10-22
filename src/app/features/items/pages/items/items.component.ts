import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { Item } from '../../../../shared/models/item.model';
import {
  ItemDialogComponent,
  ItemDialogData,
} from '../../components/item-dialog/item-dialog.component';
import { ItemsService } from '../../services/items.service';
import { confirmDelete } from '../../../../shared/utils/confirm-delete';

@Component({
  selector: 'app-items',
  imports: [DecimalPipe, MatIconModule],
  templateUrl: './items.component.html',
})
export class ItemsComponent {
  private readonly itemsService = inject(ItemsService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.items.set(await this.itemsService.list());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load items');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openDialog(item?: Item): Promise<void> {
    const ref = this.dialog.open<ItemDialogComponent, ItemDialogData, boolean>(
      ItemDialogComponent,
      {
        data: { item },
        width: '36rem',
        maxWidth: '95vw',
      },
    );

    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) {
      await this.load();
    }
  }

  protected async deleteItem(item: Item): Promise<void> {
    const deleted = await confirmDelete(this.dialog, {
      title: 'Delete item',
      message: `Delete "${item.name}"? This cannot be undone.`,
      action: () => this.itemsService.delete(item.code),
    });

    if (deleted) {
      this.items.update((list) => list.filter((i) => i.code !== item.code));
    }
  }
}
