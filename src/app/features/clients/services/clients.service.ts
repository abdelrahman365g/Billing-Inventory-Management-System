import { inject, Service } from '@angular/core';
import { Supabase } from '../../../core/services/supabase';
import { Client } from '../../../shared/models/client.model';

@Service()
export class ClientsService {
  private readonly supabase = inject(Supabase);

  async list(): Promise<Client[]> {
    const { data, error } = await this.supabase.client.rpc('clients_list');
    if (error) throw new Error(error.message);
    return (data ?? []) as Client[];
  }

  async add(name: string, phone: string, address: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('clients_add', {
      p_name: name,
      p_phone: phone,
      p_address: address,
    });
    if (error) throw new Error(error.message);
  }

  async update(id: number, name: string, phone: string, address: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('clients_update', {
      p_id: id,
      p_name: name,
      p_phone: phone,
      p_address: address,
    });
    if (error) throw new Error(error.message);
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('clients_delete', { p_id: id });
    if (error) throw new Error(error.message);
  }
}
