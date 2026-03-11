import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sale } from '../core/models';
import { StorageService } from '../core/storage.service';

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
        <input [(ngModel)]="selectedDate" type="date" />
      </label>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        <div class="stack-md">
          <p class="caption">{{ formattedDate }}</p>
          <div class="report-grid">
            <article class="card stat-card"><p>Ventas</p><strong>{{ filteredSales.length }}</strong></article>
            <article class="card stat-card"><p>Articulos</p><strong>{{ totalItems }}</strong></article>
            <article class="card stat-card"><p>Ingresos</p><strong>{{ totalRevenue.toFixed(2) }} EUR</strong></article>
            <article class="card stat-card"><p>Ganancia</p><strong class="text-primary">+{{ totalProfit.toFixed(2) }} EUR</strong></article>
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

  constructor(private readonly storage: StorageService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.sales = this.storage.getSales().filter((sale) => !sale.canceled);
      this.loading.set(false);
    }, 300);
  }

  get filteredSales(): Sale[] {
    const [year, month, day] = this.selectedDate.split('-').map(Number);
    return this.sales.filter((sale) => sale.timestamp.getFullYear() === year && sale.timestamp.getMonth() === month - 1 && sale.timestamp.getDate() === day);
  }

  get totalItems(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.items.length, 0);
  }

  get totalRevenue(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }

  get totalProfit(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.estimatedProfit, 0);
  }

  get topProducts(): Array<{ name: string; quantity: number; total: number }> {
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    for (const sale of this.filteredSales) {
      for (const item of sale.items) {
        const current = totals.get(item.productId) ?? { name: item.productName, quantity: 0, total: 0 };
        current.quantity += item.quantity;
        current.total += item.subtotal;
        totals.set(item.productId, current);
      }
    }
    return [...totals.values()].sort((left, right) => right.quantity - left.quantity).slice(0, 5);
  }

  get formattedDate(): string {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(this.selectedDate));
  }
}
