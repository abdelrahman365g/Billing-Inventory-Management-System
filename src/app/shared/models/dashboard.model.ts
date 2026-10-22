export interface DashboardBill {
  id: number;
  number: number;
  date: string;
  clientName: string;
  net: number;
  paidUp: number;
  rest: number;
}

export interface DashboardMonth {
  month: string;
  net: number;
  bills: number;
}

export interface DashboardItem {
  code: number;
  name: string;
  quantity: number;
  revenue: number;
}

export interface DashboardDebtor {
  clientId: number;
  clientName: string;
  bills: number;
  rest: number;
}

export interface Dashboard {
  today: { bills: number; net: number };
  month: { bills: number; net: number; paid: number };
  outstanding: { amount: number; bills: number };
  monthly: DashboardMonth[];
  recent: DashboardBill[];
  topItems: DashboardItem[];
  debtors: DashboardDebtor[];
}
