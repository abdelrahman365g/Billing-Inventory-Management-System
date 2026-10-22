import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { form, FormField, FormRoot, pattern, required, validate } from '@angular/forms/signals';
import { Company } from '../../../../shared/models/company.model';
import { Item } from '../../../../shared/models/item.model';
import { ItemType } from '../../../../shared/models/item-type.model';
import { Unit } from '../../../../shared/models/unit.model';
import { CompaniesService } from '../../../companies/services/companies.service';
import { ItemsService } from '../../services/items.service';
import { TypesService } from '../../../types/services/types.service';
import { UnitsService } from '../../../units/services/units.service';

export interface ItemDialogData {
  item?: Item;
}

const MAX_PRICE = 9_999_999_999.99;

function priceError(label: string, raw: string): string | null {
  const text = raw.trim();
  if (text === '') return `${label} is Required`;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return `${label} must be a valid number`;

  const value = Number(text);
  if (value < 0) return `${label} Must be Greater than or equal Zero`;
  if (value > MAX_PRICE) return `${label} is too large`;
  return null;
}

@Component({
  selector: 'app-item-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './item-dialog.component.html',
})
export class ItemDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<ItemDialogComponent, boolean>>(MatDialogRef);
  private readonly data = inject<ItemDialogData>(MAT_DIALOG_DATA);
  private readonly itemsService = inject(ItemsService);
  private readonly companiesService = inject(CompaniesService);
  private readonly typesService = inject(TypesService);
  private readonly unitsService = inject(UnitsService);

  protected readonly isEdit = !!this.data.item;

  protected readonly companies = signal<Company[]>([]);
  protected readonly types = signal<ItemType[]>([]);
  protected readonly units = signal<Unit[]>([]);
  protected readonly loadingLookups = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly serverError = signal<string | null>(null);

  protected readonly nameServerError = computed(() => {
    const message = this.serverError();
    return message?.includes('ITEM NAME') ? message : null;
  });
  protected readonly generalServerError = computed(() =>
    this.nameServerError() ? null : this.serverError(),
  );

  private readonly model = signal({
    companyId: this.data.item ? String(this.data.item.companyId) : '',
    typeId: this.data.item ? String(this.data.item.typeId) : '',
    unitId: this.data.item ? String(this.data.item.unitId) : '',
    name: this.data.item?.name ?? '',
    sellingPrice: this.data.item ? String(this.data.item.sellingPrice) : '',
    buyingPrice: this.data.item ? String(this.data.item.buyingPrice) : '',
  });

  protected readonly hasCompany = computed(() => this.model().companyId !== '');
  protected readonly filteredTypes = computed(() => {
    const companyId = this.model().companyId;
    return companyId === '' ? [] : this.types().filter((t) => String(t.companyId) === companyId);
  });

  protected readonly itemForm = form(
    this.model,
    (path) => {
      required(path.companyId, { message: 'COMPANY NAME is Required' });
      required(path.typeId, { message: 'TYPE NAME is Required' });
      required(path.unitId, { message: 'UNIT NAME is Required' });

      required(path.name, { message: 'ITEM NAME is Required' });
      pattern(path.name, /\S/, { message: 'ITEM NAME is Required' });

      validate(path.sellingPrice, ({ value }) => {
        const message = priceError('SELLING PRICE', value());
        return message ? { kind: 'price', message } : null;
      });

      validate(path.buyingPrice, ({ value, valueOf }) => {
        const message = priceError('BUYING PRICE', value());
        if (message) return { kind: 'price', message };

        const sellingRaw = valueOf(path.sellingPrice);
        if (priceError('SELLING PRICE', sellingRaw) === null) {
          if (Number(value().trim()) > Number(sellingRaw.trim())) {
            return {
              kind: 'range',
              message: 'BUYING PRICE Must be less than or equal SELLING PRICE',
            };
          }
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          this.serverError.set(null);

          try {
            const value = this.model();
            const input = {
              companyId: Number(value.companyId),
              typeId: Number(value.typeId),
              unitId: Number(value.unitId),
              name: value.name.trim(),
              sellingPrice: Number(value.sellingPrice.trim()),
              buyingPrice: Number(value.buyingPrice.trim()),
            };

            if (this.data.item) {
              await this.itemsService.update(this.data.item.code, input);
            } else {
              await this.itemsService.add(input);
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
    this.loadLookups();
  }

  protected async loadLookups(): Promise<void> {
    this.loadingLookups.set(true);
    this.loadError.set(null);

    try {
      const [companies, types, units] = await Promise.all([
        this.companiesService.list(),
        this.typesService.list(),
        this.unitsService.list(),
      ]);
      this.companies.set(companies);
      this.types.set(types);
      this.units.set(units);
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : 'Failed to load the dropdown data');
    } finally {
      this.loadingLookups.set(false);
    }
  }

  protected onCompanyChange(): void {
    this.model.update((m) => ({ ...m, typeId: '' }));
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
