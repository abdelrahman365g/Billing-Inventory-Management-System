import { inject, Service } from '@angular/core';
import {
  CreatedPayment,
  CreatePaymentInput,
  Payment,
  UnpaidBill,
} from '../../../shared/models/payment.model';
import { Supabase } from '../../../core/services/supabase';

interface UnpaidBillRow {
  bill_id: number;
  bill_number: number;
  bill_date: string;
  client_id: number;
  client_name: string;
  net: number;
  paid_up: number;
  rest: number;
}

interface PaymentRow {
  payment_id: number;
  payment_number: number;
  payment_date: string;
  bill_id: number;
  bill_number: number;
  client_name: string;
  amount: number;
  note: string | null;
}

@Service()
export class PaymentsService {
  private readonly supabase = inject(Supabase);

  async unpaidBills(): Promise<UnpaidBill[]> {
    const { data, error } = await this.supabase.client.rpc('payments_unpaid_bills', {
      p_client_id: null,
    });
    if (error) throw new Error(error.message);

    return ((data ?? []) as UnpaidBillRow[]).map((row) => ({
      id: row.bill_id,
      number: row.bill_number,
      date: row.bill_date,
      clientId: row.client_id,
      clientName: row.client_name,
      net: Number(row.net),
      paidUp: Number(row.paid_up),
      rest: Number(row.rest),
    }));
  }

  async recent(limit = 20): Promise<Payment[]> {
    const { data, error } = await this.supabase.client.rpc('payments_list', { p_limit: limit });
    if (error) throw new Error(error.message);

    return ((data ?? []) as PaymentRow[]).map((row) => ({
      id: row.payment_id,
      number: row.payment_number,
      date: row.payment_date,
      billId: row.bill_id,
      billNumber: row.bill_number,
      clientName: row.client_name,
      amount: Number(row.amount),
      note: row.note,
    }));
  }

  async create(input: CreatePaymentInput): Promise<CreatedPayment> {
    const { data, error } = await this.supabase.client.rpc('payments_create', {
      p_bill_id: input.billId,
      p_amount: input.amount,
      p_payment_date: input.paymentDate,
      p_note: input.note,
    });
    if (error) throw new Error(error.message);

    const payment = data as { id: number; payment_number: number };
    return { id: payment.id, paymentNumber: payment.payment_number };
  }
}
