import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sale } from '../core/models';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'app-sale-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page page-narrow">
      <div class="editor-header mobile-only">
        <button class="btn btn-ghost btn-icon" type="button" (click)="goBack()">&lt;</button>
        <h1>Venta #{{ sale?.id }}</h1>
      </div>

      <div class="page-header desktop-only">
        <h1>Venta #{{ sale?.id }}</h1>
        @if (sale) {
          <p>{{ longDate }}</p>
        }
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else if (!sale) {
        <div class="card empty-state">Venta no encontrada</div>
      } @else {
        <div class="stack-md">
          @if (sale.canceled) {
            <div class="card sale-alert-danger">
              <strong>Venta anulada</strong>
              <p>Esta venta ha sido cancelada</p>
            </div>
          }

          <article class="card">
            <div class="sale-summary-grid">
              <div>
                <p>Fecha</p>
                <strong>{{ sale.timestamp.toLocaleDateString('es-ES') }}</strong>
              </div>
              <div>
                <p>Hora</p>
                <strong>{{ sale.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }}</strong>
              </div>
              <div>
                <p>Productos</p>
                <strong>{{ sale.items.length }}</strong>
              </div>
              <div>
                <p>Total</p>
                <strong>{{ sale.total.toFixed(2) }} EUR</strong>
              </div>
            </div>
          </article>

          <article class="card">
            <div class="stack-sm sale-items-list">
              @for (item of sale.items; track item.productId + '-' + item.productName) {
                <div class="sale-line-item">
                  <div>
                    <h3>{{ item.productName }}</h3>
                    <p>{{ item.quantity }} x {{ item.unitPrice.toFixed(2) }} EUR</p>
                  </div>
                  <strong>{{ item.subtotal.toFixed(2) }} EUR</strong>
                </div>
              }
            </div>

            <div class="sale-totals">
              <div>
                <p>Total Venta</p>
                <strong>{{ sale.total.toFixed(2) }} EUR</strong>
              </div>
              <div>
                <p>Ganancia Est.</p>
                <strong class="text-primary">+{{ sale.estimatedProfit.toFixed(2) }} EUR</strong>
              </div>
            </div>
          </article>

          @if (!sale.canceled) {
            <button class="btn btn-danger btn-block" type="button" (click)="cancelSale()">Anular Venta</button>
          }
        </div>
      }
    </section>
  `,
})
export class SaleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly storage = inject(StorageService);

  readonly loading = signal(true);
  sale: Sale | null = null;
  longDate = '';

  ngOnInit(): void {
    const saleId = this.route.snapshot.paramMap.get('id');

    setTimeout(() => {
      if (saleId) {
        this.sale = this.storage.getSaleById(saleId);
        if (this.sale) {
          this.longDate = new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(this.sale.timestamp);
        }
      }

      this.loading.set(false);
    }, 300);
  }

  cancelSale(): void {
    if (!this.sale) {
      return;
    }

    const shouldCancel = window.confirm('Anular esta venta? Esta accion no se puede deshacer.');
    if (!shouldCancel) {
      return;
    }

    this.sale = { ...this.sale, canceled: true };
    this.storage.saveSale(this.sale);
  }

  goBack(): void {
    this.location.back();
  }
}
