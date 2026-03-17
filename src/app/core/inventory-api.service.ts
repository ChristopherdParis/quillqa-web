import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, Sale, SaleItem, TenantSummary, TenantUser } from './models';
import { StorageService } from './storage.service';

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryRecord = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type ProductRecord = {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unit: string;
  unitCost: number;
  unitSale: number;
  reorderPoint: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type WarehouseRecord = {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
};

type StockLevelRecord = {
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  reserved: number;
  lastUpdated: string;
};

type SaleLineRecord = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
};

type SaleRecord = {
  id: string;
  tenantId: string;
  customerId: string | null;
  warehouseId: string;
  status: string;
  createdAt: string;
  lines: SaleLineRecord[];
};

type WrappedSaleRecord = {
  order?: SaleRecord;
  lines?: SaleLineRecord[];
};

export type MovementRecord = {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  unitCost: number;
  createdAt: string;
};

export type CreateProductRequest = {
  sku: string;
  name: string;
  unit: string;
  unitCost?: number;
  unitSale?: number;
  categoryId?: string | null;
  description?: string;
  reorderPoint?: number;
  active?: boolean;
};

export type CreateTenantRequest = {
  name: string;
  slug: string;
  ownerEmail: string;
  plan: 'starter' | 'team' | 'business';
};

export type CreateTenantUserRequest = {
  fullName: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
};

export type UpdateProductRequest = {
  sku?: string;
  name?: string;
  unit?: string;
  unitCost?: number;
  unitSale?: number;
  categoryId?: string | null;
  description?: string | null;
  reorderPoint?: number;
  active?: boolean;
};

export type CreateSaleLineRequest = {
  productId: string;
  quantity: number;
  unitPrice?: number;
};

export type CreateSaleRequest = {
  warehouseId?: string;
  customerId?: string | null;
  lines: CreateSaleLineRequest[];
};

export type ListSalesFilters = {
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type ListMovementFilters = {
  productId?: string;
  warehouseId?: string;
  referenceType?: string;
  referenceId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type DashboardSummaryRequest = {
  from?: string;
  to?: string;
};

export type DashboardSummary = {
  totalSales: number;
  totalItems: number;
  totalRevenue: number;
  totalProfit: number;
  stockIn: number;
  stockOut: number;
  movementCount: number;
  recentSales: Sale[];
};

export type AdminDashboardSummary = {
  totalTenants: number;
  activeTenants: number;
  starterTenants: number;
  teamTenants: number;
  businessTenants: number;
};

type ApiPayload = {
  error?: {
    message?: string;
    error?: string;
  };
};

@Injectable({
  providedIn: 'root',
})
export class InventoryApiService {
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  private async resolveTenantId(): Promise<string> {
    const configuredTenantId = this.storage.getActiveTenantId();
    if (configuredTenantId) {
      return configuredTenantId;
    }

    const tenants = await firstValueFrom(this.http.get<TenantRecord[]>(`${this.apiBaseUrl}/tenants`));
    if (!tenants.length) {
      throw new Error('No hay tenants configurados en backend. Crea uno y guarda el Tenant ID en ajustes.');
    }

    const selectedTenantId = tenants[0]?.id;
    if (!selectedTenantId) {
      throw new Error('No se encontró un Tenant ID válido en el backend.');
    }

    this.storage.saveActiveTenantId(selectedTenantId);
    return selectedTenantId;
  }

  async listCategories(): Promise<CategoryRecord[]> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(this.http.get<CategoryRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/categories`));
  }

  async listTenants(): Promise<TenantSummary[]> {
    return firstValueFrom(this.http.get<TenantSummary[]>(`${this.apiBaseUrl}/tenants`));
  }

  async createTenant(input: CreateTenantRequest): Promise<TenantSummary> {
    return firstValueFrom(this.http.post<TenantSummary>(`${this.apiBaseUrl}/tenants`, input));
  }

  async getTenantBySlug(slug: string): Promise<TenantSummary | null> {
    try {
      return await firstValueFrom(this.http.get<TenantSummary>(`${this.apiBaseUrl}/tenants/slug/${slug}`));
    } catch {
      return null;
    }
  }

  async listTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return firstValueFrom(this.http.get<TenantUser[]>(`${this.apiBaseUrl}/tenants/${tenantId}/users`));
  }

  async createTenantUser(tenantId: string, input: CreateTenantUserRequest): Promise<TenantUser> {
    return firstValueFrom(this.http.post<TenantUser>(`${this.apiBaseUrl}/tenants/${tenantId}/users`, input));
  }

  async listProducts(): Promise<ProductRecord[]> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(this.http.get<ProductRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/products`));
  }

  async getProduct(productId: string): Promise<ProductRecord | null> {
    const tenantId = await this.resolveTenantId();
    try {
      return await firstValueFrom(this.http.get<ProductRecord>(`${this.apiBaseUrl}/tenants/${tenantId}/products/${productId}`));
    } catch {
      return null;
    }
  }

  async listStockLevels(): Promise<StockLevelRecord[]> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(this.http.get<StockLevelRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/stock`));
  }

  async listWarehouses(): Promise<WarehouseRecord[]> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(this.http.get<WarehouseRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/warehouses`));
  }

  async createProduct(input: CreateProductRequest): Promise<ProductRecord> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(
      this.http.post<ProductRecord>(`${this.apiBaseUrl}/tenants/${tenantId}/products`, input),
    );
  }

  async updateProduct(productId: string, input: UpdateProductRequest): Promise<ProductRecord> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(
      this.http.patch<ProductRecord>(`${this.apiBaseUrl}/tenants/${tenantId}/products/${productId}`, input),
    );
  }

  async deleteProduct(productId: string): Promise<void> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(this.http.delete<void>(`${this.apiBaseUrl}/tenants/${tenantId}/products/${productId}`));
  }

  async listSales(filters: ListSalesFilters = {}): Promise<Sale[]> {
    const tenantId = await this.resolveTenantId();
    const query = this.buildQuery({
      status: filters.status,
      from: filters.from,
      to: filters.to,
      limit: filters.limit,
      offset: filters.offset,
    });
    return firstValueFrom(
      this.http
        .get<SaleRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/sales${query}`)
        .pipe(
          map((sales) => sales.map((sale) => this.mapSaleRecordToModel(sale))),
        ),
    );
  }

  async getDashboardSummary(filters: DashboardSummaryRequest = {}): Promise<DashboardSummary> {
    const salesFilters: ListSalesFilters = {
      status: 'SHIPPED',
      from: filters.from,
      to: filters.to,
    };
    const movementFilters: ListMovementFilters = {
      from: filters.from,
      to: filters.to,
    };

    const [sales, movements] = await Promise.all([this.listSales(salesFilters), this.listStockMovements(movementFilters)]);

    const totalSales = sales.length;
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.estimatedProfit, 0);

    const stockIn = this.sumMovementQuantities(movements, (type) =>
      ['PURCHASE_RECEIPT', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(type),
    );
    const stockOut = this.sumMovementQuantities(movements, (type) =>
      ['SALE_SHIPMENT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'].includes(type),
    );

    return {
      totalSales,
      totalItems,
      totalRevenue,
      totalProfit,
      stockIn,
      stockOut,
      movementCount: movements.length,
      recentSales: [...sales].sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime()).slice(0, 5),
    };
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const tenants = await this.listTenants();
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((tenant) => tenant.status === 'ACTIVE').length,
      starterTenants: tenants.filter((tenant) => tenant.plan === 'starter').length,
      teamTenants: tenants.filter((tenant) => tenant.plan === 'team').length,
      businessTenants: tenants.filter((tenant) => tenant.plan === 'business').length,
    };
  }

  async listSubscriptions(): Promise<Array<{ tenantId: string; plan: string; status: string }>> {
    const tenants = await this.listTenants();
    return tenants.map((tenant) => ({ tenantId: tenant.id, plan: tenant.plan, status: tenant.status }));
  }

  async getSystemHealth(): Promise<{ status: 'healthy'; checkedAt: string }> {
    return {
      status: 'healthy',
      checkedAt: new Date().toISOString(),
    };
  }

  async getGlobalSettings(): Promise<{ supportEmail: string; tenancyMode: string }> {
    return {
      supportEmail: 'admin@quillqa.com',
      tenancyMode: 'shared-domain',
    };
  }

  async getSale(saleId: string): Promise<Sale | null> {
    const tenantId = await this.resolveTenantId();
    try {
      const response = await firstValueFrom(
        this.http.get<WrappedSaleRecord | SaleRecord>(
          `${this.apiBaseUrl}/tenants/${tenantId}/sales/${saleId}`,
        ),
      );
      return this.mapSaleRecordToModel(this.extractSaleRecord(response));
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createSale(input: CreateSaleRequest): Promise<Sale> {
    const tenantId = await this.resolveTenantId();
    const payload: CreateSaleRequest = {
      warehouseId: input.warehouseId,
      customerId: input.customerId ?? null,
      lines: input.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        ...(line.unitPrice !== undefined ? { unitPrice: line.unitPrice } : {}),
      })),
    };
    const created = await firstValueFrom(
      this.http.post<WrappedSaleRecord | SaleRecord>(`${this.apiBaseUrl}/tenants/${tenantId}/sales`, payload),
    );
    return this.mapSaleRecordToModel(this.extractSaleRecord(created));
  }

  async cancelSale(saleId: string, reason?: string): Promise<Sale> {
    const tenantId = await this.resolveTenantId();
    const payload: { reason?: string } = reason ? { reason } : {};
    const canceled = await firstValueFrom(
      this.http.patch<WrappedSaleRecord | SaleRecord>(
        `${this.apiBaseUrl}/tenants/${tenantId}/sales/${saleId}/cancel`,
        payload,
      ),
    );
    return this.mapSaleRecordToModel(this.extractSaleRecord(canceled));
  }

  async listSaleLines(saleId: string): Promise<SaleLineRecord[]> {
    const tenantId = await this.resolveTenantId();
    return firstValueFrom(
      this.http.get<SaleLineRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/sales/${saleId}/lines`),
    );
  }

  async listStockMovements(filters: ListMovementFilters = {}): Promise<MovementRecord[]> {
    const tenantId = await this.resolveTenantId();
    const query = this.buildQuery({
      productId: filters.productId,
      warehouseId: filters.warehouseId,
      referenceType: filters.referenceType,
      referenceId: filters.referenceId,
      from: filters.from,
      to: filters.to,
      limit: filters.limit,
      offset: filters.offset,
    });
    return firstValueFrom(
      this.http.get<MovementRecord[]>(`${this.apiBaseUrl}/tenants/${tenantId}/stock/movements${query}`),
    );
  }

  async listProductCatalogForUi(): Promise<Product[]> {
    const [products, categories, stockLevels] = await Promise.all([
      this.listProducts(),
      this.listCategories(),
      this.listStockLevels(),
    ]);

    const categoryNameById = categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});

    const stockByProduct = stockLevels.reduce<Record<string, number>>((acc, stock) => {
      const quantity = acc[stock.productId] ?? 0;
      acc[stock.productId] = quantity + stock.quantityOnHand;
      return acc;
    }, {});

    return products
      .map((product): Product => {
        const quantity = stockByProduct[product.id] ?? 0;
        const categoryName = product.categoryId ? categoryNameById[product.categoryId] : '';
        return {
          id: product.id,
          name: product.name,
          code: product.sku,
          sku: product.sku,
          category: categoryName || 'Sin categoría',
          categoryId: product.categoryId,
          description: product.description,
          unit: product.unit,
          reorderPoint: product.reorderPoint,
          active: product.active,
          costPrice: product.unitCost,
          salePrice: product.unitSale,
          stock: Math.max(0, quantity),
          minStock: product.reorderPoint,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        };
      })
      .sort((productA, productB) => productA.name.localeCompare(productB.name, 'es'));
  }

  async getProductForUi(productId: string): Promise<Product | null> {
    const [product, categories, stockLevels] = await Promise.all([
      this.getProduct(productId),
      this.listCategories(),
      this.listStockLevels(),
    ]);

    if (!product) {
      return null;
    }

    const categoryNameById = categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});

    const quantity = stockLevels
      .filter((stock) => stock.productId === product.id)
      .reduce((total, stock) => total + stock.quantityOnHand, 0);

    return {
      id: product.id,
      name: product.name,
      code: product.sku,
      sku: product.sku,
      category: product.categoryId ? categoryNameById[product.categoryId] || 'Sin categoría' : 'Sin categoría',
      categoryId: product.categoryId,
      description: product.description,
      unit: product.unit,
      reorderPoint: product.reorderPoint,
      active: product.active,
      costPrice: product.unitCost,
      salePrice: product.unitSale,
      stock: Math.max(0, quantity),
      minStock: product.reorderPoint,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    };
  }

  async getActiveTenantId(): Promise<string> {
    return this.resolveTenantId();
  }

  async getMovementRecord(saleId: string): Promise<MovementRecord[]> {
    return this.listStockMovements({ referenceId: saleId });
  }

  private extractSaleRecord(payload: WrappedSaleRecord | SaleRecord): SaleRecord {
    if (payload && 'order' in payload && payload.order) {
      return payload.order;
    }

    if ((payload as SaleRecord).lines) {
      return payload as SaleRecord;
    }

    throw new Error('Respuesta de venta no válida');
  }

  private mapSaleRecordToModel(sale: SaleRecord): Sale {
    const items: SaleItem[] = sale.lines.map((line) => {
      const unitPrice = line.unitPrice ?? 0;
      return {
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice,
        subtotal: unitPrice * line.quantity,
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: sale.id,
      items,
      total,
      estimatedProfit: 0,
      timestamp: new Date(sale.createdAt),
      canceled: sale.status === 'CANCELLED',
      paymentMethod: 'backend',
      comment: undefined,
      cancellationReason: undefined,
      status: sale.status,
    };
  }

  private sumMovementQuantities(
    movements: MovementRecord[],
    predicate: (type: string) => boolean,
  ): number {
    return movements.reduce((sum, movement) => (predicate(movement.type) ? sum + movement.quantity : sum), 0);
  }

  private buildQuery(params: Record<string, string | number | undefined>): string {
    const entries = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return entries.length ? `?${entries.join('&')}` : '';
  }
}

