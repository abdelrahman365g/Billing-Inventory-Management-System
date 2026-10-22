import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { Company } from '../../../../shared/models/company.model';
import { ItemType } from '../../../../shared/models/item-type.model';
import { TypesService } from '../../services/types.service';
import { CompaniesService } from '../../../companies/services/companies.service';

export interface TypeDialogData {
  type?: ItemType; // present = edit, absent = add
}

@Component({
  selector: 'app-type-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './type-dialog.component.html',
})
export class TypeDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<TypeDialogComponent, boolean>>(MatDialogRef);
  private readonly data = inject<TypeDialogData>(MAT_DIALOG_DATA);
  private readonly typesService = inject(TypesService);
  private readonly companiesService = inject(CompaniesService);

  protected readonly isEdit = !!this.data.type;

  protected readonly companies = signal<Company[]>([]);
  protected readonly loadingCompanies = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly serverError = signal<string | null>(null);

  private readonly model = signal({
    companyId: this.data.type ? String(this.data.type.companyId) : '',
    name: this.data.type?.name ?? '',
  });

  protected readonly typeForm = form(
    this.model,
    (path) => {
      required(path.companyId, { message: 'COMPANY NAME is Required' });
      required(path.name, { message: 'TYPE NAME is Required' });
      pattern(path.name, /\S/, { message: 'TYPE NAME is Required' });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);

          try {
            const value = this.model();
            const companyId = Number(value.companyId);
            const name = value.name.trim();

            if (this.data.type) {
              await this.typesService.update(this.data.type.id, companyId, name);
            } else {
              await this.typesService.add(companyId, name);
            }

            this.dialogRef.close(true);
          } catch (e) {
            this.serverError.set(e instanceof Error ? e.message : 'Something went wrong');
          }
        },
      },
    },
  );

  constructor() {
    this.loadCompanies();
  }

  protected async loadCompanies(): Promise<void> {
    this.loadingCompanies.set(true);
    this.loadError.set(null);

    try {
      this.companies.set(await this.companiesService.list());
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      this.loadingCompanies.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
