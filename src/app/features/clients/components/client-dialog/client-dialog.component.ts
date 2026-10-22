import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { Client } from '../../../../shared/models/client.model';
import { ClientsService } from '../../services/clients.service';

export interface ClientDialogData {
  client?: Client;
}

const EGYPT_MOBILE = /^(\+?20|0)?1[0125][0-9]{8}$/;

@Component({
  selector: 'app-client-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './client-dialog.component.html',
})
export class ClientDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ClientDialogComponent, boolean>>(MatDialogRef);
  private readonly data = inject<ClientDialogData>(MAT_DIALOG_DATA);
  private readonly clientsService = inject(ClientsService);

  protected readonly isEdit = !!this.data.client;

  protected readonly numberLabel = this.data.client
    ? String(this.data.client.number)
    : 'Auto-generated';

  protected readonly serverError = signal<string | null>(null);

  // the duplicate-name message belongs under the name field, anything else in a banner
  protected readonly nameServerError = computed(() => {
    const message = this.serverError();
    return message?.includes('CLIENT NAME') ? message : null;
  });
  protected readonly generalServerError = computed(() =>
    this.nameServerError() ? null : this.serverError(),
  );

  private readonly model = signal({
    name: this.data.client?.name ?? '',
    phone: this.data.client?.phone ?? '',
    address: this.data.client?.address ?? '',
  });

  protected readonly clientForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'CLIENT NAME is Required' });
      pattern(path.name, /\S/, { message: 'CLIENT NAME is Required' });

      required(path.phone, { message: 'PHONE is Required' });
      pattern(path.phone, EGYPT_MOBILE, {
        message: 'PHONE must be a valid Egyptian mobile number',
      });

      required(path.address, { message: 'Address is Required' });
      pattern(path.address, /\S/, { message: 'Address is Required' });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);

          try {
            const value = this.model();
            const name = value.name.trim();
            const phone = value.phone.trim();
            const address = value.address.trim();

            if (this.data.client) {
              await this.clientsService.update(this.data.client.id, name, phone, address);
            } else {
              await this.clientsService.add(name, phone, address);
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
