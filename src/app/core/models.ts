export interface Product {
  id: string;
  name: string;
  code: string;
  sku?: string;
  unit?: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string | null;
  description?: string | null;
  reorderPoint?: number;
  active?: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  estimatedProfit: number;
  timestamp: Date;
  status?: string;
  canceled: boolean;
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  comment?: string;
  cancellationReason?: string;
}

export interface BusinessSettings {
  name: string;
  phone?: string;
  currency: string;
  userId: string;
  tenantId?: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
