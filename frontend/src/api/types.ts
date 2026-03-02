export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type CurrentUserResponse = {
  username: string;
  role: string;
  shopName: string;
};

export type RegisterRequest = {
  shopName: string;
  ownerName: string;
  mobile: string;
  username: string;
  password: string;
};

export type DashboardResponse = {
  todaySales: number;
  todayCollection: number;
  totalPendingAmount: number;
  totalCustomers: number;
  lowStockProducts: Array<{ name: string; stockQuantity: number }>;
};

export type ProductRequest = {
  name: string;
  price: number;
  stockQuantity: number;
};

export type ProductResponse = {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
};

export type CustomerRequest = {
  name: string;
  mobile: string;
  address: string;
};

export type CustomerResponse = {
  id: number;
  name: string;
  mobile: string;
  address: string;
};

export type BillItemResponse = {
  productName: string;
  price: number;
  quantity: number;
};

export type BillResponse = {
  id: number;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  invoiceNumber: number;
  invoiceCode: string;
  remainingAmount: number;
  items: BillItemResponse[];
};

export type CreateBillRequest = {
  customerId: number;
  items: Array<{ productId: number; quantity: number }>;
};

export type PaymentRequest = {
  amountPaid: number;
};

export type StaffRequest = {
  username: string;
  password: string;
};

export type StaffResponse = {
  id: number;
  username: string;
};

export type CustomerLedgerEntry = {
  date: string;
  type: string;
  amount: number;
  invoiceCode: string;
};

export type CustomerLedgerResponse = {
  customerName: string;
  balance: number;
  entries: CustomerLedgerEntry[];
};

export type PurchaseItemRequest = {
  productId: number;
  quantity: number;
  purchasePrice: number;
};

export type PurchaseRequest = {
  supplierName: string;
  items: PurchaseItemRequest[];
};

export type PurchaseItemResponse = {
  productName: string;
  quantity: number;
  purchasePrice: number;
};

export type PurchaseResponse = {
  id: number;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseItemResponse[];
};
