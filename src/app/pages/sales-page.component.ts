import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sale } from '../core/models';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header page-header-inline">
        <div>
          <h1>Ventas</h1>
          <p>Historial de transacciones</p>
        </div>
        <a class="btn btn-primary" routerLink="/sales/new">Nueva Venta</a>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else if (!groupedSales.length) {
        <div class="card empty-state">No hay ventas registradas</div>
      } @else {
        <div class="mobile-only stack-md">
          @for (group of groupedSales; track group.dateKey) {
            <section>
              <h2 class="group-title">{{ group.dateKey }}</h2>
              <div class="stack-sm">
                @for (sale of group.sales; track sale.id) {
                  <a class="card list-card" [routerLink]="['/sales', sale.id]">
                    <div>
                      <h3>
                        {{ sale.items.length }} articulos
                        @if (sale.canceled) {
                          <span class="pill pill-danger sale-status-pill">Anulado</span>
                        }
                      </h3>
                      <p>{{ formatTime(sale.timestamp) }}</p>
                      @if (sale.comment) {
                        <p>{{ sale.comment }}</p>
                      }
                      @if (sale.canceled && sale.cancellationReason) {
                        <p>Motivo: {{ sale.cancellationReason }}</p>
                      }
                    </div>
                    <div class="list-card-meta">
                      <strong>{{ sale.total.toFixed(2) }} EUR</strong>
                      <span>+{{ sale.estimatedProfit.toFixed(2) }} EUR</span>
                    </div>
                  </a>
                }
              </div>
            </section>
          }
        </div>

        <div class="desktop-only table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Articulos</th>
                <th>Total</th>
                <th>Ganancia</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (group of groupedSales; track group.dateKey) {
                <tr class="table-group-row">
                  <td colspan="5">{{ group.dateKey }}</td>
                </tr>
                @for (sale of group.sales; track sale.id) {
                  <tr>
                    <td>{{ formatTime(sale.timestamp) }}</td>
                    <td>
                      {{ sale.items.length }} articulos
                      @if (sale.canceled) {
                        <span class="pill pill-danger sale-status-pill">Anulado</span>
                      }
                    </td>
                    <td>{{ sale.total.toFixed(2) }} EUR</td>
                    <td class="text-primary">+{{ sale.estimatedProfit.toFixed(2) }} EUR</td>
                    <td class="text-right">
                      <a class="btn btn-ghost" [routerLink]="['/sales', sale.id]">Ver</a>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class SalesPageComponent implements OnInit {
  readonly loading = signal(true);
  sales: Sale[] = [];

  constructor(private readonly storage: StorageService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.sales = this.storage.getSales();
      this.loading.set(false);
    }, 300);
  }

  get groupedSales(): Array<{ dateKey: string; sales: Sale[] }> {
    const map = new Map<string, Sale[]>();
    for (const sale of this.sales) {
      const key = sale.timestamp.toLocaleDateString('es-ES');
      const current = map.get(key) ?? [];
      current.push(sale);
      map.set(key, current);
    }
    return [...map.entries()].map(([dateKey, sales]) => ({ dateKey, sales }));
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
