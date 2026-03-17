import { Injectable } from '@angular/core';
import { mockBusinessSettings, mockProducts, mockSales } from './mock-data';
import { BusinessSettings, Product, Sale } from './models';

const STORAGE_KEYS = {
  products: 'store_products',
  sales: 'store_sales',
  settings: 'store_settings',
  appAuthToken: 'store_app_auth_token',
  appAuthSession: 'store_app_auth_session',
  appAuthRole: 'store_app_auth_role',
  adminAuthToken: 'store_admin_auth_token',
  adminAuthSession: 'store_admin_auth_session',
  adminAuthRole: 'store_admin_auth_role',
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

  getProductById(productId: string): Product | null {
    return this.getProducts().find((product) => product.id === productId) ?? null;
  }

  saveProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }

    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }

  deleteProduct(productId: string): void {
    const products = this.getProducts().filter((product) => product.id !== productId);
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }

  getActiveTenantId(): string | null {
    return this.getBusinessSettings().tenantId?.trim() || null;
  }

  saveActiveTenantId(tenantId: string): void {
    const settings = this.getBusinessSettings();
    const sanitizedTenantId = tenantId.trim();
    if (!sanitizedTenantId) {
      return;
    }

    this.saveBusinessSettings({
      ...settings,
      tenantId: sanitizedTenantId,
    });
  }

  getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.sales);
    const sales = raw ? JSON.parse(raw) : mockSales;
    return sales.map((sale: Sale) => ({
      ...sale,
      timestamp: new Date(sale.timestamp),
    }));
  }

  getSaleById(saleId: string): Sale | null {
    return this.getSales().find((sale) => sale.id === saleId) ?? null;
  }

  saveSale(sale: Sale): void {
    const sales = this.getSales();
    const index = sales.findIndex((item) => item.id === sale.id);

    if (index >= 0) {
      sales[index] = sale;
    } else {
      sales.push(sale);
    }

    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
  }

  restoreStockForSale(sale: Sale): void {
    const products = this.getProducts();
    if (!sale.items.length) {
      return;
    }

    let updated = false;
    for (const item of sale.items) {
      const productIndex = products.findIndex((product) => product.id === item.productId);
      if (productIndex < 0) {
        continue;
      }

      const current = products[productIndex];
      if (!current) {
        continue;
      }

      products[productIndex] = {
        ...current,
        stock: current.stock + item.quantity,
        updatedAt: new Date(),
      };
      updated = true;
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    }
  }

  generateSaleId(): string {
    const sales = this.getSales();
    const maxNum = Math.max(
      0,
      ...sales.map((sale) => {
        const match = sale.id.match(/\d+/);
        return match ? Number.parseInt(match[0], 10) : 0;
      }),
    );

    return `V${String(maxNum + 1).padStart(3, '0')}`;
  }

  getBusinessSettings(): BusinessSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : mockBusinessSettings;
  }

  saveBusinessSettings(settings: BusinessSettings): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  getAppAuthToken(): string | null {
    const rawSession = localStorage.getItem(STORAGE_KEYS.appAuthSession);
    if (!rawSession) {
      return localStorage.getItem(STORAGE_KEYS.appAuthToken);
    }

    try {
      const parsed = JSON.parse(rawSession) as { token: string; expiresAt: number };
      if (!parsed.token || !parsed.expiresAt) {
        this.clearAppAuthToken();
        return null;
      }

      if (Date.now() > parsed.expiresAt) {
        this.clearAppAuthToken();
        return null;
      }

      return parsed.token;
    } catch {
      this.clearAppAuthToken();
      return null;
    }
  }

  getAppAuthRole(): string | null {
    const rawSession = localStorage.getItem(STORAGE_KEYS.appAuthSession);
    if (!rawSession) {
      return localStorage.getItem(STORAGE_KEYS.appAuthRole);
    }

    try {
      const parsed = JSON.parse(rawSession) as { role?: string; expiresAt: number };
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        this.clearAppAuthToken();
        return null;
      }

      return parsed.role ?? localStorage.getItem(STORAGE_KEYS.appAuthRole);
    } catch {
      this.clearAppAuthToken();
      return null;
    }
  }

  setAppAuthToken(token: string, expiresInHours = 8, role = 'user'): void {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.appAuthSession, JSON.stringify({ token, expiresAt, role }));
    localStorage.setItem(STORAGE_KEYS.appAuthToken, token);
    localStorage.setItem(STORAGE_KEYS.appAuthRole, role);
  }

  clearAppAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.appAuthToken);
    localStorage.removeItem(STORAGE_KEYS.appAuthSession);
    localStorage.removeItem(STORAGE_KEYS.appAuthRole);
  }

  getAdminAuthToken(): string | null {
    const rawSession = localStorage.getItem(STORAGE_KEYS.adminAuthSession);
    if (!rawSession) {
      return localStorage.getItem(STORAGE_KEYS.adminAuthToken);
    }

    try {
      const parsed = JSON.parse(rawSession) as { token: string; expiresAt: number };
      if (!parsed.token || !parsed.expiresAt) {
        this.clearAdminAuthToken();
        return null;
      }

      if (Date.now() > parsed.expiresAt) {
        this.clearAdminAuthToken();
        return null;
      }

      return parsed.token;
    } catch {
      this.clearAdminAuthToken();
      return null;
    }
  }

  getAdminAuthRole(): string | null {
    const rawSession = localStorage.getItem(STORAGE_KEYS.adminAuthSession);
    if (!rawSession) {
      return localStorage.getItem(STORAGE_KEYS.adminAuthRole);
    }

    try {
      const parsed = JSON.parse(rawSession) as { role?: string; expiresAt: number };
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        this.clearAdminAuthToken();
        return null;
      }

      return parsed.role ?? localStorage.getItem(STORAGE_KEYS.adminAuthRole);
    } catch {
      this.clearAdminAuthToken();
      return null;
    }
  }

  setAdminAuthToken(token: string, expiresInHours = 8, role = 'admin'): void {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.adminAuthSession, JSON.stringify({ token, expiresAt, role }));
    localStorage.setItem(STORAGE_KEYS.adminAuthToken, token);
    localStorage.setItem(STORAGE_KEYS.adminAuthRole, role);
  }

  clearAdminAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.adminAuthToken);
    localStorage.removeItem(STORAGE_KEYS.adminAuthSession);
    localStorage.removeItem(STORAGE_KEYS.adminAuthRole);
  }
}
