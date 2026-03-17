import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sale } from '../core/models';
import { FeedbackService } from '../core/feedback.service';
import { InventoryApiService } from '../core/inventory-api.service';

@Component({
  selector: 'app-sale-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <p>Esta venta ha sido anulada</p>
              @if (sale.cancellationReason) {
                <p>Motivo: {{ sale.cancellationReason }}</p>
              }
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
              <div>
                <p>Pago</p>
                <strong>{{ formatPaymentMethod(sale.paymentMethod) }}</strong>
              </div>
            </div>
          </article>

          @if (sale.comment) {
            <article class="card">
              <h2 class="section-title">Comentario</h2>
              <p class="sale-comment-copy">{{ sale.comment }}</p>
            </article>
          }

          @if (sale.paymentMethod === 'cash') {
            <article class="card">
              <h2 class="section-title">Pago en efectivo</h2>
              <div class="sale-totals">
                <div>
                  <p>Monto recibido</p>
                  <strong>{{ (sale.amountPaid ?? 0).toFixed(2) }} EUR</strong>
                </div>
                <div>
                  <p>Vuelto</p>
                  <strong class="text-primary">{{ (sale.changeDue ?? 0).toFixed(2) }} EUR</strong>
                </div>
              </div>
            </article>
          }

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
            @if (!showCancelForm()) {
              <button class="btn btn-danger btn-block" type="button" (click)="showCancelForm.set(true)">Anular Venta</button>
            } @else {
              <article class="card stack-sm">
                <h2 class="section-title">Motivo de anulacion</h2>

                <label class="field">
                  <span>Selecciona un motivo</span>
                  <select [(ngModel)]="selectedReason">
                    @for (reason of cancellationReasons; track reason) {
                      <option [value]="reason">{{ reason }}</option>
                    }
                  </select>
                </label>

                @if (selectedReason === 'Otro') {
                  <label class="field">
                    <span>Escribe el motivo</span>
                    <input [(ngModel)]="customReason" type="text" placeholder="Detalle de la anulacion" />
                  </label>
                }

                <div class="form-actions">
                  <button class="btn btn-danger btn-block" type="button" [disabled]="!canCancelSale()" (click)="cancelSale()">
                    Confirmar Anulacion
                  </button>
                  <button class="btn btn-outline btn-block" type="button" (click)="resetCancelForm()">Cancelar</button>
                </div>
              </article>
            }
          }
        </div>
      }
    </section>
  `,
})
export class SaleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly feedback = inject(FeedbackService);
  private readonly inventoryApi = inject(InventoryApiService);

  readonly loading = signal(true);
  readonly showCancelForm = signal(false);
  sale: Sale | null = null;
  longDate = '';
  selectedReason = 'Error de cobro';
  customReason = '';
  readonly cancellationReasons = ['Error de cobro', 'Producto equivocado', 'Pedido cancelado por cliente', 'Error de inventario', 'Otro'];

  ngOnInit(): void {
    const saleId = this.route.snapshot.paramMap.get('id');
    if (!saleId) {
      this.loading.set(false);
      return;
    }

    this.loadSale(saleId);
  }

  async loadSale(saleId: string): Promise<void> {
    try {
      this.sale = await this.inventoryApi.getSale(saleId);
      if (this.sale) {
        this.longDate = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(this.sale.timestamp);
      }
    } catch {
      this.sale = null;
    } finally {
      this.loading.set(false);
    }
  }

  canCancelSale(): boolean {
    return this.selectedReason !== 'Otro' || !!this.customReason.trim();
  }

  async cancelSale(): Promise<void> {
    if (!this.sale) {
      this.feedback.error('No se encontrÃ³ la venta para anular.');
      return;
    }

    if (!this.canCancelSale()) {
      this.feedback.error('Completa el motivo de anulaciÃ³n.');
      return;
    }

    if (this.sale.canceled) {
      this.feedback.info('La venta ya estaba anulada.');
      return;
    }

    const reason = this.selectedReason === 'Otro' ? this.customReason.trim() : this.selectedReason;
    try {
      this.sale = await this.inventoryApi.cancelSale(this.sale.id, reason);
      this.showCancelForm.set(false);
      this.feedback.success('Venta anulada y stock restaurado.');
    } catch {
      this.feedback.error('No se pudo anular la venta. Intenta de nuevo.');
    }
  }

  resetCancelForm(): void {
    this.selectedReason = 'Error de cobro';
    this.customReason = '';
    this.showCancelForm.set(false);
  }

  goBack(): void {
    this.location.back();
  }

  formatPaymentMethod(method?: string): string {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'wallet':
        return 'Billetera digital';
      default:
        return 'No definido';
    }
  }
}


