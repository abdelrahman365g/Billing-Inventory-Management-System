import { Component, inject, signal } from '@angular/core';
import { CompaniesService } from '../../services/companies.service';
import { MatDialog } from '@angular/material/dialog';
import { Company } from '../../../../shared/models/company.model';
import {
  CompanyDialogComponent,
  CompanyDialogData,
} from '../../components/company-dialog/company-dialog.component';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { confirmDelete } from '../../../../shared/utils/confirm-delete';

@Component({
  imports: [MatIconModule],
  selector: 'app-companies',
  templateUrl: './companies.component.html',
})
export class CompaniesComponent {
  private readonly companiesService = inject(CompaniesService);
  private readonly dialog = inject(MatDialog);

  private readonly companies = signal<Company[]>([]);
  private readonly loading = signal(true);
  private readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.companies.set(await this.companiesService.list());
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      this.loading.set(false);
    }
  }

  async openDialog(company?: Company): Promise<void> {
    const ref = this.dialog.open<CompanyDialogComponent, CompanyDialogData, boolean>(
      CompanyDialogComponent,
      {
        data: { company },
        width: '28rem',
        maxWidth: '95vw',
      },
    );
    const saved = await firstValueFrom(ref.afterClosed());
    if (saved) await this.load();
  }

  protected async deleteCompany(company: Company): Promise<void> {
    const deleted = await confirmDelete(this.dialog, {
      title: 'Delete company',
      message: `Delete "${company.name}"? This cannot be undone.`,
      action: () => this.companiesService.delete(company.id),
    });

    if (deleted) {
      this.companies.update((list) => list.filter((c) => c.id !== company.id));
    }
  }
}
