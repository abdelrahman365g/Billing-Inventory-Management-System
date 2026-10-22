import { inject, Service } from '@angular/core';
import { Supabase } from '../../../core/services/supabase';
import { ItemType } from '../../../shared/models/item-type.model';

interface TypeRow {
  type_id: number;
  type_name: string;
  company_id: number;
  company_name: string;
}

@Service()
export class TypesService {
  private readonly supabase = inject(Supabase);

  async list(companyId?: number): Promise<ItemType[]> {
    const { data, error } = await this.supabase.client.rpc('types_list', {
      p_company_id: companyId ?? null,
    });
    if (error) throw new Error(error.message);

    return ((data ?? []) as TypeRow[]).map((row) => ({
      id: row.type_id,
      name: row.type_name,
      companyId: row.company_id,
      companyName: row.company_name,
    }));
  }

  async add(companyId: number, name: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('types_add', {
      p_company_id: companyId,
      p_name: name,
    });
    if (error) throw new Error(error.message);
  }

  async update(id: number, companyId: number, name: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('types_update', {
      p_id: id,
      p_company_id: companyId,
      p_name: name,
    });
    if (error) throw new Error(error.message);
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('types_delete', { p_id: id });
    if (error) throw new Error(error.message);
  }
}
