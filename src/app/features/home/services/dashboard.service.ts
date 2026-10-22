import { inject, Injectable, Service } from '@angular/core';
import { Dashboard } from '../../../shared/models/dashboard.model';
import { todayLocal } from '../../../shared/utils/date-helpers';
import { Supabase } from '../../../core/services/supabase';

interface DashboardRow {
  today: { bills: number; net: number };
  month: { bills: number; net: number; paid: number };
  outstanding: { amount: number; bills: number };
  monthly: { month: string; net: number; bills: number }[];
  recent: {
    id: number;
    bill_number: number;
    bill_date: string;
    client_name: string;
    net: number;
    paid_up: number;
    rest: number;
  }[];
  top_items: { item_code: number; item_name: string; quantity: number; revenue: number }[];
  debtors: { client_id: number; client_name: string; bills: number; total_rest: number }[];
}

@Service()
export class DashboardService {
  private readonly supabase = inject(Supabase);

  async get(): Promise<Dashboard> {
    const { data, error } = await this.supabase.client.rpc('dashboard_get', {
      p_today: todayLocal(),
      p_months: 6,
    });
    if (error) throw new Error(error.message);

    const row = data as DashboardRow;
    return {
      today: { bills: Number(row.today.bills), net: Number(row.today.net) },
      month: {
        bills: Number(row.month.bills),
        net: Number(row.month.net),
        paid: Number(row.month.paid),
      },
      outstanding: {
        amount: Number(row.outstanding.amount),
        bills: Number(row.outstanding.bills),
      },
      monthly: row.monthly.map((m) => ({
        month: `${m.month}-01`,
        net: Number(m.net),
        bills: Number(m.bills),
      })),
      recent: row.recent.map((b) => ({
        id: b.id,
        number: b.bill_number,
        date: b.bill_date,
        clientName: b.client_name,
        net: Number(b.net),
        paidUp: Number(b.paid_up),
        rest: Number(b.rest),
      })),
      topItems: row.top_items.map((i) => ({
        code: i.item_code,
        name: i.item_name,
        quantity: Number(i.quantity),
        revenue: Number(i.revenue),
      })),
      debtors: row.debtors.map((d) => ({
        clientId: d.client_id,
        clientName: d.client_name,
        bills: Number(d.bills),
        rest: Number(d.total_rest),
      })),
    };
  }
}
