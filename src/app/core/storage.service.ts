import { Injectable } from '@angular/core';
import { mockBusinessSettings, mockProducts, mockSales } from './mock-data';
import { BusinessSettings, Product, Sale } from './models';

const STORAGE_KEYS = {
  products: 'store_products',
  sales: 'store_sales',
  settings: 'store_settings',
  authToken: 'store_auth_token',
};

@Injectable({ providedIn: 'root' })
export class StorageService {
  initializeStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.products)) {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(mockProducts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.sales)) {
      localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(mockSales));
    }
    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(mockBusinessSettings));
    }
  }

  getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.products);
    const products = raw ? JSON.parse(raw) : mockProducts;
    return products.map((product: Product) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    }));
  }

  getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.sales);
    const sales = raw ? JSON.parse(raw) : mockSales;
    return sales.map((sale: Sale) => ({
      ...sale,
      timestamp: new Date(sale.timestamp),
    }));
  }

  getBusinessSettings(): BusinessSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : mockBusinessSettings;
  }

  saveBusinessSettings(settings: BusinessSettings): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.authToken);
  }

  setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
  }

  clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.authToken);
  }
}
