import { api } from "./client";
import type {
  BillResponse,
  CurrentUserResponse,
  CreateBillRequest,
  CustomerLedgerResponse,
  CustomerRequest,
  CustomerResponse,
  DashboardResponse,
  LoginRequest,
  LoginResponse,
  PaymentRequest,
  PurchaseRequest,
  PurchaseResponse,
  ProductRequest,
  ProductResponse,
  RegisterRequest,
  StaffResponse,
  StaffRequest
} from "./types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function registerOwner(payload: RegisterRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/register", payload);
  return data;
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await api.get<CurrentUserResponse>("/auth/me");
  return data;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
}

export async function fetchProducts(): Promise<ProductResponse[]> {
  const { data } = await api.get<ProductResponse[]>("/products");
  return data;
}

export async function createProduct(payload: ProductRequest): Promise<ProductResponse> {
  const { data } = await api.post<ProductResponse>("/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductRequest): Promise<ProductResponse> {
  const { data } = await api.put<ProductResponse>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function fetchCustomers(): Promise<CustomerResponse[]> {
  const { data } = await api.get<CustomerResponse[]>("/customers");
  return data;
}

export async function createCustomer(payload: CustomerRequest): Promise<CustomerResponse> {
  const { data } = await api.post<CustomerResponse>("/customers", payload);
  return data;
}

export async function fetchBills(): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>("/bills");
  return data;
}

export async function createBill(payload: CreateBillRequest): Promise<BillResponse> {
  const { data } = await api.post<BillResponse>("/bills", payload);
  return data;
}

export async function makePayment(id: number, payload: PaymentRequest): Promise<BillResponse> {
  const { data } = await api.put<BillResponse>(`/bills/${id}/payment`, payload);
  return data;
}

export async function fetchPendingBills(): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>("/bills/pending");
  return data;
}

export async function fetchBillsByStatus(status: string): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>("/bills/status", { params: { status } });
  return data;
}

export async function searchBillsByCustomerName(customerName: string): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>("/bills/search", { params: { customerName } });
  return data;
}

export async function downloadBillInvoice(id: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/bills/${id}/invoice`, { responseType: "blob" });
  return data;
}

export async function fetchReminderEligibleBills(): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>("/bills/reminders");
  return data;
}

export async function fetchReminderMessage(id: number): Promise<string> {
  const { data } = await api.get<string>(`/bills/${id}/reminder-message`, { responseType: "text" });
  return data;
}

export async function fetchWhatsappLink(id: number): Promise<string> {
  const { data } = await api.get<string>(`/bills/${id}/whatsapp-link`, { responseType: "text" });
  return data;
}

export async function fetchCustomerBills(id: number): Promise<BillResponse[]> {
  const { data } = await api.get<BillResponse[]>(`/customers/${id}/bills`);
  return data;
}

export async function fetchCustomerLedger(id: number): Promise<CustomerLedgerResponse> {
  const { data } = await api.get<CustomerLedgerResponse>(`/customers/${id}/ledger`);
  return data;
}

export async function createStaff(payload: StaffRequest): Promise<string> {
  const { data } = await api.post<string>("/auth/create-staff", payload, { responseType: "text" });
  return data;
}

export async function fetchStaff(): Promise<StaffResponse[]> {
  const { data } = await api.get<StaffResponse[]>("/auth/staff");
  return data;
}

export async function updateStaff(id: number, payload: StaffRequest): Promise<StaffResponse> {
  const { data } = await api.put<StaffResponse>(`/auth/staff/${id}`, payload);
  return data;
}

export async function deleteStaff(id: number): Promise<void> {
  await api.delete(`/auth/staff/${id}`);
}

export async function createPurchase(payload: PurchaseRequest): Promise<PurchaseResponse> {
  const { data } = await api.post<PurchaseResponse>("/purchases", payload);
  return data;
}
