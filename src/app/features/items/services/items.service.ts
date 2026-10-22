import { inject, Injectable, Service } from '@angular/core';
import { Supabase } from '../../../core/services/supabase';
import { Item, ItemInput } from '../../../shared/models/item.model';

interface ItemRow {
  item_code: number;
  item_name: string;
  company_id: number;
  company_name: string;
  type_id: number;
  type_name: string;
  unit_id: number;
  unit_name: string;
  selling_price: number;
  buying_price: number;
}

@Service()
export class ItemsService {
  private readonly supabase = inject(Supabase);

  async list(): Promise<Item[]> {
    const { data, error } = await this.supabase.client.rpc('items_list');
    if (error) throw new Error(error.message);

    return ((data ?? []) as ItemRow[]).map((row) => ({
      code: row.item_code,
      name: row.item_name,
      companyId: row.company_id,
      companyName: row.company_name,
      typeId: row.type_id,
      typeName: row.type_name,
      unitId: row.unit_id,
      unitName: row.unit_name,
      sellingPrice: Number(row.selling_price),
      buyingPrice: Number(row.buying_price),
    }));
  }

  async add(input: ItemInput): Promise<void> {
    const { error } = await this.supabase.client.rpc('items_add', {
      p_company_id: input.companyId,
      p_type_id: input.typeId,
      p_unit_id: input.unitId,
      p_name: input.name,
      p_selling_price: input.sellingPrice,
      p_buying_price: input.buyingPrice,
    });
    if (error) throw new Error(error.message);
  }

  async update(code: number, input: ItemInput): Promise<void> {
    const { error } = await this.supabase.client.rpc('items_update', {
      p_item_code: code,
      p_company_id: input.companyId,
      p_type_id: input.typeId,
      p_unit_id: input.unitId,
      p_name: input.name,
      p_selling_price: input.sellingPrice,
      p_buying_price: input.buyingPrice,
    });
    if (error) throw new Error(error.message);
  }

  async delete(code: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('items_delete', { p_item_code: code });
    if (error) throw new Error(error.message);
  }
}
