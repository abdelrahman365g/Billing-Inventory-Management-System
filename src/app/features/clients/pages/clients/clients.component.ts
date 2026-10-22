import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { Client } from '../../../../shared/models/client.model';
import {
  ClientDialogComponent,
  ClientDialogData,
} from '../../components/client-dialog/client-dialog.component';
import { ClientsService } from '../../services/clients.service';
import { confirmDelete } from '../../../../shared/utils/confirm-delete';

@Component({
  selector: 'app-clients',
  imports: [MatIconModule],
  templateUrl: './clients.component.html',
})
export class ClientsComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly dialog = inject(MatDialog);

  protected readonly clients = signal<Client[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.clients.set(await this.clientsService.list());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load clients');
    } finally {
      this.loading.set(false);
    }
  }

  protected async openDialog(client?: Client): Promise<void> {
    const ref = this.dialog.open<ClientDialogComponent, ClientDialogData, boolean>(
      ClientDialogComponent,
      {
        data: { client },
        width: '32rem',
        maxWidth: '95vw',
      },
    );

    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) {
      await this.load();
    }
  }

  protected async deleteClient(client: Client): Promise<void> {
    const deleted = await confirmDelete(this.dialog, {
      title: 'Delete client',
      message: `Delete "${client.name}"? This cannot be undone.`,
      action: () => this.clientsService.delete(client.id),
    });

    if (deleted) {
      this.clients.update((list) => list.filter((c) => c.id !== client.id));
    }
  }
}
