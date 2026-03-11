export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
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
}
