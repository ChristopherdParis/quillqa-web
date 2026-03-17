import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product, Sale, SaleItem } from '../core/models';
import { FeedbackService } from '../core/feedback.service';
import { InventoryApiService } from '../core/inventory-api.service';

type SaleStep = 'cart' | 'confirm';

@Component({
  selector: 'app-sale-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <div class="editor-header mobile-only">
        <button class="btn btn-ghost btn-icon" type="button" (click)="handleBack()">&lt;</button>
        <h1>{{ currentStep() === 'cart' ? 'Nueva Venta' : 'Confirmar Venta' }}</h1>
      </div>

      <div class="page-header desktop-only">
        <h1>{{ currentStep() === 'cart' ? 'Nueva Venta' : 'Confirmar Venta' }}</h1>
        <p>{{ currentStep() === 'cart' ? 'Seleccion de productos' : 'Revision final y metodo de pago' }}</p>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else if (currentStep() === 'cart') {
        <div class="sales-layout">
          <section class="sales-main">
            <h2 class="section-title">Buscar Productos</h2>

            <div class="stack-md">
              <input [(ngModel)]="searchTerm" class="search-input" type="text" placeholder="Buscar producto por nombre o codigo..." />

              <div class="search-results">
                @if (filteredProducts.length) {
                  @for (product of filteredProducts; track product.id) {
                    <article class="card product-search-card">
                      <div class="product-search-copy">
                        <h3>{{ product.name }}</h3>
                        <p>{{ product.salePrice.toFixed(2) }} EUR | Stock: {{ product.stock }}</p>
                      </div>

                      <div class="product-search-actions">
                        <input
                          class="qty-input"
                          type="number"
                          min="1"
                          [max]="product.stock"
                          [ngModel]="getSelectedQty(product.id)"
                          (ngModelChange)="setSelectedQty(product.id, $event, product.stock)"
                        />
                        <button class="btn btn-primary btn-icon" type="button" (click)="addToCart(product)">+</button>
                      </div>
                    </article>
                  }
                } @else if (searchTerm.trim()) {
                  <div class="card empty-state">No hay productos disponibles</div>
                } @else {
                  <div class="card empty-state">Busca un producto para comenzar</div>
                }
              </div>
            </div>
          </section>

          <aside class="sales-sidebar">
            <h2 class="section-title">Carrito</h2>

              @if (!cartItems.length) {
                <div class="card empty-state">Carrito vacio</div>
              } @else {
                @if (formErrors().length) {
                  <article class="card validation-summary">
                    <h3 class="validation-title">Corrige estos datos antes de continuar:</h3>
                    <ul>
                      @for (message of formErrors(); track message) {
                        <li>{{ message }}</li>
                      }
                    </ul>
                  </article>
                }

                <div class="stack-sm">
                  @for (item of cartItems; track item.productId) {
                  <article class="card cart-item-card">
                    <div class="cart-item-head">
                      <div>
                        <h3>{{ item.productName }}</h3>
                        <p>{{ item.unitPrice.toFixed(2) }} EUR c/u</p>
                      </div>
                      <button class="btn btn-ghost btn-icon text-danger" type="button" (click)="removeItem(item.productId)">x</button>
                    </div>

                    <div class="cart-item-foot">
                      <div class="qty-stepper">
                        <button class="btn btn-outline btn-icon" type="button" (click)="updateQuantity(item.productId, item.quantity - 1)" [disabled]="item.quantity <= 1">-</button>
                        <span>{{ item.quantity }}</span>
                        <button class="btn btn-outline btn-icon" type="button" (click)="updateQuantity(item.productId, item.quantity + 1)">+</button>
                      </div>
                      <strong>{{ item.subtotal.toFixed(2) }} EUR</strong>
                    </div>
                  </article>
                }
              </div>
            }

              <div class="card sale-total-card">
                <p>Total actual</p>
                <strong>{{ total.toFixed(2) }} EUR</strong>
                <button class="btn btn-primary btn-block" type="button" (click)="goToConfirm()" [disabled]="!cartItems.length">
                  Continuar a Confirmacion
              </button>
            </div>
          </aside>
        </div>
      } @else {
        <div class="confirm-layout">
          <section class="confirm-main stack-md">
            <article class="card">
              <h2 class="section-title">Detalle Seleccionado</h2>
              <div class="stack-sm">
                @for (item of cartItems; track item.productId) {
                  <div class="sale-line-item">
                    <div>
                      <h3>{{ item.productName }}</h3>
                      <p>{{ item.quantity }} x {{ item.unitPrice.toFixed(2) }} EUR</p>
                    </div>
                    <strong>{{ item.subtotal.toFixed(2) }} EUR</strong>
                  </div>
                }
              </div>
            </article>
          </section>

          <aside class="confirm-sidebar stack-md">
            <article class="card">
              <div class="form-stack">
                @if (warehouses.length) {
                  <label class="field">
                    <span>Bodega</span>
                    <select [(ngModel)]="selectedWarehouseId" name="warehouseId">
                      @for (warehouse of warehouses; track warehouse.id) {
                        <option [value]="warehouse.id">
                          {{ warehouse.name }}{{ warehouse.isDefault ? ' (predeterminada)' : '' }}
                        </option>
                      }
                    </select>
                  </label>
                }

                <label class="field">
                  <span>Metodo de pago</span>
                  <select [(ngModel)]="paymentMethod" name="paymentMethod">
                    @for (method of paymentMethods; track method.value) {
                      <option [value]="method.value">{{ method.label }}</option>
                    }
                  </select>
                </label>

              @if (paymentMethod === 'cash') {
                @if (amountPaid !== null && amountPaid !== undefined && !isValidPaymentAmount()) {
                  <p class="field field-inline validation-inline-error">
                    El monto recibido debe ser mayor o igual al total.
                  </p>
                }

                <label class="field">
                  <span>Monto recibido</span>
                  <input
                    [(ngModel)]="amountPaid"
                    name="amountPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    [class.field-error]="paymentMethod === 'cash' && !canSubmitSale() && amountPaid !== null"
                  />
                </label>

                  <div class="sale-payment-summary">
                    <div>
                      <p>Total</p>
                      <strong>{{ total.toFixed(2) }} EUR</strong>
                    </div>
                    <div>
                      <p>Vuelto</p>
                      <strong [class.text-danger]="changeDue < 0" [class.text-primary]="changeDue >= 0">
                        {{ changeDue >= 0 ? changeDue.toFixed(2) + ' EUR' : 'Falta ' + missingAmount.toFixed(2) + ' EUR' }}
                      </strong>
                    </div>
                  </div>
                }
              </div>
            </article>

            <article class="card">
              <label class="field">
                <span>Comentario de la venta</span>
                <textarea
                  [(ngModel)]="comment"
                  class="sale-comment-input"
                  rows="4"
                  placeholder="Agrega una nota opcional para esta venta"
                ></textarea>
              </label>
            </article>

            <div class="card sale-total-card">
              <p>Total a pagar</p>
              <strong>{{ total.toFixed(2) }} EUR</strong>
              <p class="sale-final-copy">Metodo de pago: {{ paymentMethodLabel }}</p>
              @if (paymentMethod === 'cash') {
                <p class="sale-final-copy">Pago recibido: {{ normalizedAmountPaid.toFixed(2) }} EUR</p>
              }
              @if (formErrors().length) {
                <article class="card validation-summary">
                  <h3 class="validation-title">No se puede registrar la venta:</h3>
                  <ul>
                    @for (message of formErrors(); track message) {
                      <li>{{ message }}</li>
                    }
                  </ul>
                </article>
              }
              <button class="btn btn-primary btn-block" type="button" (click)="completeSale()" [disabled]="saving() || !canSubmitSale()">
                {{ saving() ? 'Registrando...' : 'Confirmar y Registrar Venta' }}
              </button>
              <button class="btn btn-outline btn-block" type="button" (click)="currentStep.set('cart')">Volver al Carrito</button>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class SaleEditorPageComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly inventoryApi = inject(InventoryApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly currentStep = signal<SaleStep>('cart');
  readonly formErrors = signal<string[]>([]);

  products: Product[] = [];
  cartItems: SaleItem[] = [];
  warehouses: { id: string; name: string; isDefault: boolean; isActive: boolean }[] = [];
  selectedWarehouseId = '';
  searchTerm = '';
  comment = '';
  paymentMethod = 'cash';
  amountPaid: number | null = null;
  selectedQty: Record<string, number> = {};
  readonly paymentMethods = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'wallet', label: 'Billetera digital' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      const [products, warehouses] = await Promise.all([
        this.inventoryApi.listProductCatalogForUi(),
        this.inventoryApi.listWarehouses(),
      ]);
      this.products = products;
      this.warehouses = warehouses;
      this.selectedWarehouseId = warehouses.find((warehouse) => warehouse.isDefault && warehouse.isActive)?.id ?? warehouses[0]?.id ?? '';
    } catch {
      this.products = [];
      this.warehouses = [];
      this.feedback.error('No se pudo cargar el catalogo para ventas.');
    } finally {
      this.loading.set(false);
    }
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.products.filter((product) => {
      const alreadyInCart = this.cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
      const availableStock = product.stock - alreadyInCart;
      return availableStock > 0 && (!term || product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term));
    });
  }

  get total(): number {
    return this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get estimatedProfit(): number {
    return this.cartItems.reduce((sum, item) => {
      const product = this.products.find((current) => current.id === item.productId);
      return product ? sum + item.quantity * (item.unitPrice - product.costPrice) : sum;
    }, 0);
  }

  get normalizedAmountPaid(): number {
    return Number(this.amountPaid) || 0;
  }

  get changeDue(): number {
    return this.normalizedAmountPaid - this.total;
  }

  get missingAmount(): number {
    return Math.max(0, this.total - this.normalizedAmountPaid);
  }

  get paymentMethodLabel(): string {
    return this.paymentMethods.find((method) => method.value === this.paymentMethod)?.label || 'No definido';
  }

  getSelectedQty(productId: string): number {
    return this.selectedQty[productId] || 1;
  }

  setSelectedQty(productId: string, rawValue: number | string, maxStock: number): void {
    const parsed = Number(rawValue) || 1;
    this.selectedQty[productId] = Math.max(1, Math.min(parsed, maxStock));
  }

  addToCart(product: Product): void {
    const existing = this.cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
    const maxAvailable = product.stock - existing;
    const quantity = this.normalizeQuantity(this.selectedQty[product.id] ?? 1);
    const requestedQuantity = Math.max(1, Math.min(quantity, maxAvailable));

    if (maxAvailable < 1) {
      this.feedback.error('No hay stock suficiente para agregar mas de este producto.');
      return;
    }

    const found = this.cartItems.find((item) => item.productId === product.id);
    if (found) {
      this.cartItems = this.cartItems.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
          : item,
      );
    } else {
      this.cartItems = [
        ...this.cartItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: requestedQuantity,
          unitPrice: product.salePrice,
          subtotal: requestedQuantity * product.salePrice,
        },
      ];
    }

    this.selectedQty[product.id] = 1;
    this.feedback.success('Producto agregado al carrito.');
  }

  updateQuantity(productId: string, quantity: number): void {
    const normalizedQuantity = this.normalizeQuantity(quantity);
    if (normalizedQuantity < 1) {
      this.feedback.error('La cantidad debe ser mayor a cero.');
      return;
    }

    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      this.feedback.error('Producto no encontrado para actualizar.');
      return;
    }

    if (normalizedQuantity > product.stock) {
      this.feedback.error('La cantidad supera el stock disponible.');
      return;
    }

    this.cartItems = this.cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: normalizedQuantity, subtotal: normalizedQuantity * item.unitPrice } : item,
    );
  }

  removeItem(productId: string): void {
    this.cartItems = this.cartItems.filter((item) => item.productId !== productId);
  }

  goToConfirm(): void {
    const errors = this.getValidationErrors();
    if (errors.length) {
      this.formErrors.set(errors);
      this.feedback.error('Corrige los datos de la venta antes de continuar.');
      return;
    }

    this.formErrors.set([]);
    this.currentStep.set('confirm');
  }

  canSubmitSale(): boolean {
    const errors = this.getValidationErrors();
    return errors.length === 0 && this.total > 0;
  }

  private getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.cartItems.length) {
      errors.push('Agrega al menos un producto.');
    }

    if (!this.paymentMethod) {
      errors.push('Selecciona un metodo de pago.');
    }

    const invalidQuantityItems = this.cartItems.filter((item) => {
      const product = this.products.find((current) => current.id === item.productId);
      if (!product) {
        return false;
      }

      return item.quantity > product.stock;
    });

    if (invalidQuantityItems.length) {
      errors.push('Hay productos en el carrito con stock insuficiente.');
    }

    const unknownProduct = this.cartItems.find((item) => !this.products.find((product) => product.id === item.productId));
    if (unknownProduct) {
      errors.push(`El producto "${unknownProduct.productName}" ya no existe.`);
    }

    if (this.paymentMethod === 'cash') {
      if (!this.isValidPaymentAmount()) {
        errors.push('El monto recibido debe ser igual o mayor al total.');
      }
    }

    return errors;
  }

  isValidPaymentAmount(): boolean {
    if (this.paymentMethod !== 'cash') {
      return true;
    }

    if (!Number.isFinite(this.normalizedAmountPaid)) {
      return false;
    }

    return this.normalizedAmountPaid >= this.total;
  }

  async completeSale(): Promise<void> {
    const errors = this.getValidationErrors();
    if (errors.length) {
      this.formErrors.set(errors);
      this.feedback.error('Corrige los datos antes de registrar la venta.');
      return;
    }

    if (!this.currentStockIsAvailable()) {
      this.formErrors.set(['Stock insuficiente para registrar esta venta.']);
      this.feedback.error('Revisa stock disponible antes de confirmar.');
      return;
    }

    this.saving.set(true);

    try {
      const response = await this.inventoryApi.createSale({
        warehouseId: this.selectedWarehouseId || undefined,
        lines: this.cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      const sale: Sale = {
        ...response,
        items: this.cartItems,
        paymentMethod: this.paymentMethod,
        total: this.total,
        estimatedProfit: this.estimatedProfit,
        amountPaid: this.paymentMethod === 'cash' ? this.normalizedAmountPaid : undefined,
        changeDue: this.paymentMethod === 'cash' ? this.changeDue : undefined,
      };

      sale.comment = this.comment.trim() || undefined;

      await this.router.navigate(['/app/sales', sale.id]);
      this.feedback.success(`Venta ${sale.id} registrada correctamente.`);
    } catch {
      this.feedback.error('No se pudo registrar la venta. Intenta nuevamente.');
    } finally {
      this.saving.set(false);
    }
  }

  private currentStockIsAvailable(): boolean {
    for (const cartItem of this.cartItems) {
      const product = this.products.find((item) => item.id === cartItem.productId);
      if (!product || cartItem.quantity > product.stock) {
        return false;
      }
    }

    return true;
  }

  private normalizeQuantity(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
  }

  handleBack(): void {
    if (this.currentStep() === 'confirm') {
      this.currentStep.set('cart');
      return;
    }

    this.location.back();
  }
}
