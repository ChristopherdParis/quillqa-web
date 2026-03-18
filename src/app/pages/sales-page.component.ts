import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sale } from '../core/models';
import { InventoryApiService } from '../core/inventory-api.service';
import { FeedbackService } from '../core/feedback.service';

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
        <a class="btn btn-primary" routerLink="/app/sales/new">Nueva Venta</a>
      </div>

      @if (loading()) {
        <article class="card status-panel centered">
          <div class="status-icon loading" aria-hidden="true">
            <div class="loader-dots"><span></span><span></span><span></span></div>
          </div>
          <h2 class="status-panel-title">Cargando historial de ventas</h2>
          <p class="status-panel-copy">Estamos reuniendo las transacciones mas recientes para este negocio.</p>
        </article>
      } @else if (errorMessage()) {
        <article class="card status-panel centered">
          <div class="status-icon error" aria-hidden="true">!</div>
          <h2 class="status-panel-title">No pudimos cargar las ventas</h2>
          <p class="status-panel-copy">{{ errorMessage() }}</p>
          <div class="status-panel-actions">
            <button class="btn btn-primary" type="button" (click)="reload()">Reintentar</button>
            <a class="btn btn-outline" routerLink="/app/settings">Revisar configuracion</a>
          </div>
        </article>
      } @else if (!groupedSales.length) {
        <article class="card status-panel centered">
          <div class="status-icon empty" aria-hidden="true">+</div>
          <h2 class="status-panel-title">Aun no hay ventas registradas</h2>
          <p class="status-panel-copy">Registra tu primera venta para empezar a construir el historial y los reportes del negocio.</p>
          <div class="status-panel-actions">
            <a class="btn btn-primary" routerLink="/app/sales/new">Registrar primera venta</a>
          </div>
        </article>
      } @else {
        <div class="mobile-only stack-md">
          @for (group of groupedSales; track group.dateKey) {
            <section>
              <h2 class="group-title">{{ group.dateKey }}</h2>
              <div class="stack-sm">
                @for (sale of group.sales; track sale.id) {
                  <a class="card list-card" [routerLink]="['/app/sales', sale.id]">
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
                      <a class="btn btn-ghost" [routerLink]="['/app/sales', sale.id]">Ver</a>
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
  readonly errorMessage = signal('');
  sales: Sale[] = [];

  constructor(
    private readonly inventoryApi: InventoryApiService,
    private readonly feedback: FeedbackService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadSales();
  }

  async reload(): Promise<void> {
    await this.loadSales();
  }

  private async loadSales(): Promise<void> {
    this.loading.set(true);
    try {
      this.sales = await this.inventoryApi.listSales();
      this.errorMessage.set('');
    } catch (error) {
      this.sales = [];
      const message = error instanceof Error ? error.message : 'No se pudo cargar el historial de ventas.';
      this.errorMessage.set(message);
      this.feedback.error(message);
    } finally {
      this.loading.set(false);
    }
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
