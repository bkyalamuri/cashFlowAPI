const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export interface Payment {
  id: string;
  amount_cents: number;
  currency: string;
  direction: 'inbound' | 'outbound';
  counterparty: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  external_id: string | null;
}

export interface CashFlowSummary {
  start_date: string;
  end_date: string;
  total_inflow_cents: number;
  total_outflow_cents: number;
  net_cents: number;
  periods: Array<{
    period_start: string;
    period_end: string;
    inflow_cents: number;
    outflow_cents: number;
    net_cents: number;
    transaction_count: number;
  }>;
}

export interface CopilotResponse {
  answer: string;
  sources_used: string[];
}

export interface CopilotStatus {
  configured: boolean;
  message?: string;
}

export interface RegenerateResponse {
  message: string;
  count: number;
  total_inflow_cents: number;
  total_outflow_cents: number;
  net_cents: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  quantity: number;
  low_stock_threshold: number;
}

export interface InventoryTransactionResponse {
  item_id: string;
  item_name: string;
  quantity_sold: number;
  new_quantity: number;
  low_stock_alert: { item_name: string; quantity: number } | null;
}

export const api = {
  payments: {
    list: (params?: { limit?: number; direction?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.direction) q.set('direction', params.direction);
      if (params?.status) q.set('status', params.status);
      const query = q.toString();
      return request<Payment[]>(`/payments${query ? `?${query}` : ''}`);
    },
    regenerate: (count?: number) => {
      const q = count ? `?count=${count}` : '';
      return request<RegenerateResponse>(`/payments/regenerate${q}`, { method: 'POST' });
    },
  },
  cashflow: {
    summary: (startDate?: string, endDate?: string) => {
      const q = new URLSearchParams();
      if (startDate) q.set('start_date', startDate);
      if (endDate) q.set('end_date', endDate);
      const query = q.toString();
      return request<CashFlowSummary>(`/cashflow/summary${query ? `?${query}` : ''}`);
    },
  },
  copilot: {
    status: () => request<CopilotStatus>('/copilot/status'),
    ask: (question: string, context?: Record<string, unknown>) =>
      request<CopilotResponse>('/copilot/ask', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      }),
  },
  inventory: {
    list: (category?: string) => {
      const q = category ? `?category=${encodeURIComponent(category)}` : '';
      return request<InventoryItem[]>(`/inventory${q}`);
    },
    recordTransaction: (itemId: string, quantity: number) =>
      request<InventoryTransactionResponse>('/inventory/transaction', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, quantity }),
      }),
  },
};
