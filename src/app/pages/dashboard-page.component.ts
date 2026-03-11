import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, Sale } from '../core/models';
import { StorageService } from '../core/storage.service';

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
        <p class="loading-copy">Cargando...</p>
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
                <p>Ganancia Estimada</p>
                <strong class="text-primary">{{ formatCurrency(totalProfit) }}</strong>
              </article>
            </div>

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

          <aside class="quick-actions-panel">
            <div class="quick-actions-grid">
              <a class="btn btn-primary btn-block" routerLink="/sales/new">Nueva Venta</a>
              <a class="btn btn-outline btn-block" routerLink="/products/new">Nuevo Producto</a>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly storage = inject(StorageService);

  readonly loading = signal(true);
  products: Product[] = [];
  sales: Sale[] = [];
  alerts: Product[] = [];
  totalSales = 0;
  totalRevenue = 0;
  totalProfit = 0;
  formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  ngOnInit(): void {
    setTimeout(() => {
      this.products = this.storage.getProducts();
      this.sales = this.storage.getSales().filter((sale) => !sale.canceled);
      this.alerts = this.products.filter((product) => product.stock <= product.minStock).sort((a, b) => a.stock - b.stock);
      this.totalSales = this.sales.length;
      this.totalRevenue = this.sales.reduce((sum, sale) => sum + sale.total, 0);
      this.totalProfit = this.sales.reduce((sum, sale) => sum + sale.estimatedProfit, 0);
      this.loading.set(false);
    }, 300);
  }

  formatCurrency(value: number): string {
    return `${value.toFixed(2)} EUR`;
  }
}
