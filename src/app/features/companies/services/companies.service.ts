import { inject, Service } from '@angular/core';
import { Supabase } from '../../../core/services/supabase';
import { Company } from '../../../shared/models/company.model';

@Service()
export class CompaniesService {
  private readonly supabase = inject(Supabase);

  async list(): Promise<Company[]> {
    const { data, error } = await this.supabase.client.rpc('companies_list');
    if (error) throw new Error(error.message);

    return (data ?? []) as Company[];
  }

  async add(name: string): Promise<Company> {
    const { data, error } = await this.supabase.client.rpc('companies_add', { p_name: name });
    if (error) throw new Error(error.message);
    return data as Company;
  }

  async update(id: number, name: string): Promise<Company> {
    const { data, error } = await this.supabase.client.rpc('companies_update', {
      p_id: id,
      p_name: name,
    });
    if (error) throw new Error(error.message);
    return data as Company;
  }
  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('companies_delete', { p_id: id });
    if (error) throw new Error(error.message);
  }
}
