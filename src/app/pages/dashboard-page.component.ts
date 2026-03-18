import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, Sale } from '../core/models';
import { InventoryApiService } from '../core/inventory-api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header mobile-only">
        <h1>Mi Tienda</h1>
        <p>{{ formattedDate }}</p>
      </div>

      <div class="page-header desktop-only page-header-lg">
        <h1>Hola, bienvenido</h1>
        <p>{{ formattedDate }}</p>
      </div>

      @if (loading()) {
        <article class="card status-panel centered">
          <div class="status-icon loading" aria-hidden="true">
            <div class="loader-dots"><span></span><span></span><span></span></div>
          </div>
          <h2 class="status-panel-title">Preparando tu resumen del dia</h2>
          <p class="status-panel-copy">Estamos consultando ventas, stock y movimientos recientes.</p>
        </article>
      } @else if (errorMessage()) {
        <article class="card status-panel centered">
          <div class="status-icon error" aria-hidden="true">!</div>
          <h2 class="status-panel-title">No pudimos cargar el dashboard</h2>
          <p class="status-panel-copy">{{ errorMessage() }}</p>
          <div class="status-panel-actions">
            <button class="btn btn-primary" type="button" (click)="reload()">Reintentar</button>
            <a class="btn btn-outline" routerLink="/app/settings">Revisar configuracion</a>
          </div>
        </article>
      } @else {
        <div class="dashboard-grid">
          <div class="dashboard-main">
            <div class="metric-grid">
              <article class="card metric-card">
                <p>Ventas Hoy</p>
                <strong>{{ totalSales }}</strong>
              </article>
              <article class="card metric-card">
                <p>Ingresos Totales</p>
                <strong>{{ formatCurrency(totalRevenue) }}</strong>
              </article>
              <article class="card metric-card">
                <p>Entradas de Inventario</p>
                <strong class="text-primary">{{ totalStockIn }} uds</strong>
              </article>
              <article class="card metric-card">
                <p>Salidas de Inventario</p>
                <strong class="text-danger">{{ totalStockOut }} uds</strong>
              </article>
              <article class="card metric-card desktop-only">
                <p>Ganancia Estimada</p>
                <strong class="text-primary">{{ formatCurrency(totalProfit) }}</strong>
              </article>
            </div>

            <div class="quick-actions-panel mobile-only quick-actions-panel-mobile">
              <div class="quick-actions-grid">
                <a class="btn btn-primary btn-block" routerLink="/app/sales/new">Nueva Venta</a>
                <a class="btn btn-outline btn-block" routerLink="/app/products/new">Nuevo Producto</a>
              </div>
            </div>

            @if (!recentSales.length && !alerts.length) {
              <article class="card status-panel">
                <div class="status-icon empty" aria-hidden="true">+</div>
                <h2 class="status-panel-title">Tu negocio todavia no tiene actividad hoy</h2>
                <p class="status-panel-copy">Cuando registres ventas o movimientos de inventario, veras aqui el resumen del dia y las alertas de stock.</p>
                <div class="status-panel-actions">
                  <a class="btn btn-primary" routerLink="/app/sales/new">Registrar venta</a>
                  <a class="btn btn-outline" routerLink="/app/products/new">Crear producto</a>
                </div>
              </article>
            }

            @if (recentSales.length) {
              <div class="section-block">
                <h2 class="section-title">Ultimas Ventas del Dia</h2>
                <div class="stack-sm">
                  @for (sale of recentSales; track sale.id) {
                    <a class="card list-card" [routerLink]="['/app/sales', sale.id]">
                      <div>
                        <h3>Venta #{{ sale.id }}</h3>
                        <p>{{ formatTime(sale.timestamp) }} | {{ sale.items.length }} articulos</p>
                      </div>
                      <div class="list-card-meta">
                        <strong>{{ formatCurrency(sale.total) }}</strong>
                        <span class="text-primary">+{{ formatCurrency(sale.estimatedProfit) }}</span>
                      </div>
                    </a>
                  }
                </div>
              </div>
            }

            @if (alerts.length) {
              <div class="section-block">
                <h2 class="section-title">Alertas de Stock</h2>
                <div class="stack-sm">
                  @for (product of alerts; track product.id) {
                    <article class="card stock-alert-card">
                      <div>
                        <h3>{{ product.name }}</h3>
                        <p>Minimo requerido: {{ product.minStock }}</p>
                      </div>
                      <span class="pill" [class.pill-danger]="product.stock === 0" [class.pill-warn]="product.stock > 0">
                        {{ product.stock === 0 ? 'Agotado' : 'Stock bajo: ' + product.stock }}
                      </span>
                    </article>
                  }
                </div>
              </div>
            }
          </div>

          <aside class="quick-actions-panel desktop-only">
            <div class="quick-actions-grid">
              <a class="btn btn-primary btn-block" routerLink="/app/sales/new">Nueva Venta</a>
              <a class="btn btn-outline btn-block" routerLink="/app/products/new">Nuevo Producto</a>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  products: Product[] = [];
  alerts: Product[] = [];
  recentSales: Sale[] = [];
  totalSales = 0;
  totalRevenue = 0;
  totalProfit = 0;
  totalStockIn = 0;
  totalStockOut = 0;
  formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async reload(): Promise<void> {
    await this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);
    try {
      const [products, summary] = await Promise.all([
        this.inventoryApi.listProductCatalogForUi(),
        this.inventoryApi.getDashboardSummary(this.todayRange),
      ]);
      this.products = products;
      this.recentSales = [...summary.recentSales];
      this.alerts = this.products.filter((product) => product.stock <= product.minStock).sort((a, b) => a.stock - b.stock);
      this.totalSales = summary.totalSales;
      this.totalRevenue = summary.totalRevenue;
      this.totalProfit = summary.totalProfit;
      this.totalStockIn = summary.stockIn;
      this.totalStockOut = summary.stockOut;
      this.errorMessage.set('');
    } catch (error) {
      this.products = [];
      this.recentSales = [];
      this.alerts = [];
      this.totalSales = 0;
      this.totalRevenue = 0;
      this.totalProfit = 0;
      this.totalStockIn = 0;
      this.totalStockOut = 0;
      this.errorMessage.set(error instanceof Error ? error.message : 'Valida la conexion con el backend y el tenant activo.');
    } finally {
      this.loading.set(false);
    }
  }

  private get todayRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  formatCurrency(value: number): string {
    return `${value.toFixed(2)} EUR`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
