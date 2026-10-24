export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'home', route: '/' },
  { label: 'Invoices', icon: 'receipt_long', route: '/invoices' },
  { label: 'Payments', icon: 'payments', route: '/payments' },
  { label: 'Sales Report', icon: 'bar_chart', route: '/reports' },
  { label: 'Items', icon: 'inventory_2', route: '/items' },
  { label: 'Clients', icon: 'groups', route: '/clients' },
  { label: 'Companies', icon: 'business', route: '/companies' },
  { label: 'Types', icon: 'category', route: '/types' },
  { label: 'Units', icon: 'straighten', route: '/units' },
];
