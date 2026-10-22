import { inject, Service } from '@angular/core';
import { Supabase } from '../../../core/services/supabase';
import { Unit } from '../../../shared/models/unit.model';

@Service()
export class UnitsService {
  private readonly supabase = inject(Supabase);

  async list(): Promise<Unit[]> {
    const { data, error } = await this.supabase.client.rpc('units_list');
    if (error) throw new Error(error.message);
    return (data ?? []) as Unit[];
  }

  async add(name: string): Promise<Unit> {
    const { data, error } = await this.supabase.client.rpc('units_add', { p_name: name });
    if (error) throw new Error(error.message);
    return data as Unit;
  }

  async update(id: number, name: string): Promise<Unit> {
    const { data, error } = await this.supabase.client.rpc('units_update', {
      p_id: id,
      p_name: name,
    });
    if (error) throw new Error(error.message);
    return data as Unit;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('units_delete', { p_id: id });
    if (error) throw new Error(error.message);
  }
}
