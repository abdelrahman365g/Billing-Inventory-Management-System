export interface BillLineInput {
  itemId: number;
  quantity: number;
  sellingPrice: number;
  discount: number;
}

export interface BillRequestInput {
  employeeName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
}

export interface CreateBillInput {
  billDate: string;
  clientId: number;
  lines: BillLineInput[];
  percentDiscount: number;
  valueDiscount: number;
  paidUp: number;
  request: BillRequestInput;
}

export interface CreatedBill {
  id: number;
  billNumber: number;
}

// ---- sales report ----

export interface BillFilter {
  from: string | null;
  to: string | null;
  clientId: number | null;
  itemId: number | null;
}

// one card
export interface BillSummary {
  id: number;
  number: number;
  date: string;
  clientId: number;
  clientName: string;
  itemsCount: number;
  billsTotal: number;
  net: number;
  paidUp: number;
  rest: number;
}

export interface BillDetailLine {
  itemCode: number;
  itemName: string;
  unitName: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  total: number;
}

export interface BillRequestDetail {
  employeeName: string;
  requestDate: string;
  startTime: string;
  endTime: string;
}

export interface BillDetail {
  id: number;
  number: number;
  date: string;
  clientName: string;
  billsTotal: number;
  percentDiscount: number;
  valueDiscount: number;
  net: number;
  paidUp: number;
  rest: number;
  lines: BillDetailLine[];
  request: BillRequestDetail | null;
}
