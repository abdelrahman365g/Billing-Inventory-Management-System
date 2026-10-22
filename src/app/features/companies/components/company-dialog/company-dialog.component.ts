import { Component, inject, signal } from '@angular/core';
import { Company } from '../../../../shared/models/company.model';
import { CompaniesService } from '../../services/companies.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';

export interface CompanyDialogData {
  company?: Company;
}

@Component({
  imports: [FormField, FormRoot],
  selector: 'app-company-dialog',
  templateUrl: './company-dialog.component.html',
})
export class CompanyDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<CompanyDialogComponent, boolean>>(MatDialogRef);
  private readonly data = inject<CompanyDialogData>(MAT_DIALOG_DATA);
  private readonly companiesService = inject(CompaniesService);

  protected readonly isEdit = !!this.data.company;
  protected readonly serverError = signal<string | null>(null);
  private readonly model = signal({ name: this.data.company?.name ?? '' });

  protected readonly companyForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'COMPANY NAME is Required' });
      pattern(path.name, /\S/, { message: 'COMPANY NAME is Required' });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);

          try {
            const name = this.model().name.trim();

            if (this.data.company) {
              await this.companiesService.update(this.data.company.id, name);
            } else {
              await this.companiesService.add(name);
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
