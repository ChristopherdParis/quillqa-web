import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, Sale } from '../core/models';
import { InventoryApiService, MovementRecord } from '../core/inventory-api.service';

type WarehouseRecord = {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
};

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <h1>Reportes</h1>
        <p>Analisis diario de ventas</p>
      </div>

      <label class="field field-inline">
        <span>Selecciona una fecha</span>
        <input [(ngModel)]="selectedDate" type="date" (change)="loadReport()" />
      </label>
      <label class="field field-inline">
        <span>Producto (opcional)</span>
        <select [(ngModel)]="selectedProductId" (change)="loadReport()">
          <option value="">Todos</option>
          @for (product of productNamesById.keys(); track product) {
            <option [value]="product">{{ productNamesById.get(product) || product }}</option>
          }
        </select>
      </label>
      <label class="field field-inline">
        <span>Bodega (opcional)</span>
        <select [(ngModel)]="selectedWarehouseId" (change)="loadReport()">
          <option value="">Todas</option>
          @for (warehouse of warehouses; track warehouse.id) {
            <option [value]="warehouse.id">{{ warehouse.name }}</option>
          }
        </select>
      </label>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        <div class="stack-md">
          <p class="caption">{{ formattedDate }}</p>
          <div class="report-grid">
            <article class="card stat-card"><p>Ventas</p><strong>{{ filteredSales.length }}</strong></article>
            <article class="card stat-card"><p>Unidades vendidas</p><strong>{{ totalItems }}</strong></article>
            <article class="card stat-card"><p>Ingresos</p><strong>{{ totalRevenue.toFixed(2) }} EUR</strong></article>
            <article class="card stat-card"><p>Ganancia</p><strong class="text-primary">+{{ totalProfit.toFixed(2) }} EUR</strong></article>
            <article class="card stat-card"><p>Stock Entradas</p><strong class="text-primary">{{ movementIn }}</strong></article>
            <article class="card stat-card"><p>Stock Salidas</p><strong class="text-danger">{{ movementOut }}</strong></article>
            <article class="card stat-card"><p>Movimiento Neto</p><strong>{{ stockMovementNet }}</strong></article>
            <article class="card stat-card"><p>Ticket promedio</p><strong>{{ averageTicket.toFixed(2) }} EUR</strong></article>
          </div>

          @if (topProducts.length) {
            <section class="stack-sm">
              <h2 class="section-title">Productos Mas Vendidos</h2>
              <div class="mobile-only stack-sm">
                @for (product of topProducts; track product.name) {
                  <article class="card list-card">
                    <div>
                      <h3>{{ product.name }}</h3>
                      <p>{{ product.quantity }} unidades</p>
                    </div>
                    <strong>{{ product.total.toFixed(2) }} EUR</strong>
                  </article>
                }
              </div>

              <div class="desktop-only table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of topProducts; track product.name) {
                      <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.quantity }}</td>
                        <td class="text-right">{{ product.total.toFixed(2) }} EUR</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @if (!filteredSales.length) {
            <div class="card empty-state">No hay ventas registradas para esta fecha</div>
          }
        </div>
      }
    </section>
  `,
})
export class ReportsPageComponent implements OnInit {
  readonly loading = signal(true);
  selectedDate = new Date().toISOString().split('T')[0];
  sales: Sale[] = [];
  stockMovements: MovementRecord[] = [];
  warehouses: WarehouseRecord[] = [];
  selectedProductId = '';
  selectedWarehouseId = '';
  movementIn = 0;
  movementOut = 0;
  productNamesById = new Map<string, string>();

  constructor(private readonly inventoryApi: InventoryApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadReport();
  }

  async loadReport(): Promise<void> {
    const dateRange = this.selectedDateRange;
    if (!dateRange) {
      this.sales = [];
      this.stockMovements = [];
      this.warehouses = [];
      this.movementIn = 0;
      this.movementOut = 0;
      this.loading.set(false);
      this.productNamesById = new Map();
      return;
    }

    this.loading.set(true);
    try {
      const [sales, products, movements, warehouses] = await Promise.all([
        this.inventoryApi.listSales({
          from: dateRange.from,
          to: dateRange.to,
          status: 'SHIPPED',
        }),
        this.inventoryApi.listProductCatalogForUi(),
        this.inventoryApi.listStockMovements({
          from: dateRange.from,
          to: dateRange.to,
          productId: this.selectedProductId || undefined,
          warehouseId: this.selectedWarehouseId || undefined,
        }),
        this.inventoryApi.listWarehouses(),
      ]);

      this.sales = sales;
      this.stockMovements = movements;
      this.warehouses = warehouses;
      this.movementIn = this.sumMovementQuantities((movement) =>
        ['PURCHASE_RECEIPT', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(movement.type),
      );
      this.movementOut = this.sumMovementQuantities((movement) =>
        ['SALE_SHIPMENT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'].includes(movement.type),
      );
      this.productNamesById = new Map(products.map((product: Product) => [product.id, product.name]));
    } catch {
      this.sales = [];
      this.stockMovements = [];
      this.warehouses = [];
      this.movementIn = 0;
      this.movementOut = 0;
      this.productNamesById = new Map();
    } finally {
      this.loading.set(false);
    }
  }

  private sumMovementQuantities(predicate: (movement: MovementRecord) => boolean): number {
    return this.stockMovements.reduce((sum, movement) => (predicate(movement) ? sum + movement.quantity : sum), 0);
  }

  get filteredSales(): Sale[] {
    return this.sales.filter((sale) => !sale.canceled);
  }

  get totalItems(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.items.reduce((subtotal, item) => subtotal + item.quantity, 0), 0);
  }

  get totalRevenue(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }

  get totalProfit(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.estimatedProfit, 0);
  }

  get averageTicket(): number {
    return this.filteredSales.length ? this.totalRevenue / this.filteredSales.length : 0;
  }

  get stockMovementNet(): number {
    return this.movementIn - this.movementOut;
  }

  get topProducts(): Array<{ name: string; quantity: number; total: number }> {
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    for (const sale of this.filteredSales) {
      for (const item of sale.items) {
        const current = totals.get(item.productId) ?? {
          name: this.productNamesById.get(item.productId) || item.productName,
          quantity: 0,
          total: 0,
        };
        current.quantity += item.quantity;
        current.total += item.subtotal;
        totals.set(item.productId, current);
      }
    }
    return [...totals.values()].sort((left, right) => right.quantity - left.quantity).slice(0, 5);
  }

  get formattedDate(): string {
    const selectedDateTime = this.selectedDateTime;
    if (!selectedDateTime) {
      return 'Sin fecha válida';
    }

    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDateTime);
  }

  private get selectedDateTime(): Date | null {
    const parsed = new Date(`${this.selectedDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private get selectedDateRange(): { from: string; to: string } | null {
    const selectedDateTime = this.selectedDateTime;
    if (!selectedDateTime) {
      return null;
    }

    const from = new Date(selectedDateTime);
    const to = new Date(selectedDateTime);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }
}
