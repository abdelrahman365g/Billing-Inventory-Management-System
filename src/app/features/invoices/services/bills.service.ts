import { inject, Injectable } from '@angular/core';
import {
  BillDetail,
  BillFilter,
  BillSummary,
  CreateBillInput,
  CreatedBill,
} from './../../../shared/models/bill.model';
import { Supabase } from '../../../core/services/supabase';

interface BillSearchRow {
  bill_id: number;
  bill_number: number;
  bill_date: string;
  client_id: number;
  client_name: string;
  items_count: number;
  bills_total: number;
  net: number;
  paid_up: number;
  rest: number;
}

interface BillDetailRow {
  bill: {
    id: number;
    bill_number: number;
    bill_date: string;
    bills_total: number;
    percent_discount: number;
    value_discount: number;
    net: number;
    paid_up: number;
    rest: number;
  };
  client_name: string;
  lines: {
    item_code: number;
    item_name: string;
    unit: string;
    quantity: number;
    selling_price: number;
    discount: number;
    total: number;
  }[];
  request: {
    employee_name: string;
    request_date: string;
    start_time: string;
    end_time: string;
  } | null;
  payments: {
    payment_number: number;
    payment_date: string;
    amount: number;
    note: string | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class BillsService {
  private readonly supabase = inject(Supabase);

  async create(input: CreateBillInput): Promise<CreatedBill> {
    const { data, error } = await this.supabase.client.rpc('bills_create', {
      p_bill_date: input.billDate,
      p_client_id: input.clientId,
      p_lines: input.lines.map((line) => ({
        item_id: line.itemId,
        quantity: line.quantity,
        selling_price: line.sellingPrice,
        discount: line.discount,
      })),
      p_percent_discount: input.percentDiscount,
      p_value_discount: input.valueDiscount,
      p_paid_up: input.paidUp,
      p_request: {
        employee_name: input.request.employeeName,
        request_date: input.request.requestDate,
        start_time: input.request.startTime,
        end_time: input.request.endTime,
      },
    });
    if (error) throw new Error(error.message);

    const bill = data as { id: number; bill_number: number };
    return { id: bill.id, billNumber: bill.bill_number };
  }

  async search(filter: BillFilter): Promise<BillSummary[]> {
    const { data, error } = await this.supabase.client.rpc('bills_search', {
      p_from: filter.from,
      p_to: filter.to,
      p_client_id: filter.clientId,
      p_item_id: filter.itemId,
    });
    if (error) throw new Error(error.message);

    return ((data ?? []) as BillSearchRow[]).map((row) => ({
      id: row.bill_id,
      number: row.bill_number,
      date: row.bill_date,
      clientId: row.client_id,
      clientName: row.client_name,
      itemsCount: Number(row.items_count),
      billsTotal: Number(row.bills_total),
      net: Number(row.net),
      paidUp: Number(row.paid_up),
      rest: Number(row.rest),
    }));
  }

  async get(id: number): Promise<BillDetail> {
    const { data, error } = await this.supabase.client.rpc('bills_get', { p_id: id });
    if (error) throw new Error(error.message);

    const row = data as BillDetailRow;
    return {
      id: row.bill.id,
      number: row.bill.bill_number,
      date: row.bill.bill_date,
      clientName: row.client_name,
      billsTotal: Number(row.bill.bills_total),
      percentDiscount: Number(row.bill.percent_discount),
      valueDiscount: Number(row.bill.value_discount),
      net: Number(row.bill.net),
      paidUp: Number(row.bill.paid_up),
      rest: Number(row.bill.rest),
      lines: row.lines.map((line) => ({
        itemCode: line.item_code,
        itemName: line.item_name,
        unitName: line.unit,
        quantity: Number(line.quantity),
        sellingPrice: Number(line.selling_price),
        discount: Number(line.discount),
        total: Number(line.total),
      })),
      request: row.request
        ? {
            employeeName: row.request.employee_name,
            requestDate: row.request.request_date,
            startTime: row.request.start_time.slice(0, 5),
            endTime: row.request.end_time.slice(0, 5),
          }
        : null,
      payments: (row.payments ?? []).map((p) => ({
        number: p.payment_number,
        date: p.payment_date,
        amount: Number(p.amount),
        note: p.note,
      })),
    };
  }
}
