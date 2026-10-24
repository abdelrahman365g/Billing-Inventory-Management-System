export interface UnpaidBill {
  id: number;
  number: number;
  date: string;
  clientId: number;
  clientName: string;
  net: number;
  paidUp: number;
  rest: number;
}

export interface Payment {
  id: number;
  number: number;
  date: string;
  billId: number;
  billNumber: number;
  clientName: string;
  amount: number;
  note: string | null;
}

export interface CreatePaymentInput {
  billId: number;
  amount: number;
  paymentDate: string;
  note: string | null;
}

export interface CreatedPayment {
  id: number;
  paymentNumber: number;
}
