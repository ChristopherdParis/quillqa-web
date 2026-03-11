import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product, Sale, SaleItem } from '../core/models';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'app-sale-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <div class="editor-header mobile-only">
        <button class="btn btn-ghost btn-icon" type="button" (click)="goBack()">&lt;</button>
        <h1>Nueva Venta</h1>
      </div>

      <div class="page-header desktop-only">
        <h1>Nueva Venta</h1>
        <p>Registro de transaccion</p>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
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
              <div class="stack-sm">
                @for (item of cartItems; track item.productId) {
                  <article class="card cart-item-card">
                    <div class="cart-item-head">
                      <div>
                        <h3>{{ item.productName }}</h3>
                        <p>{{ item.unitPrice.toFixed(2) }} EUR c/u</p>
                      </div>
                      <button class="btn btn-ghost btn-icon text-danger" type="button" (click)="removeItem(item.productId)">×</button>
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
              <button class="btn btn-primary btn-block" type="button" (click)="completeSale()" [disabled]="!cartItems.length || saving()">
                {{ saving() ? 'Registrando...' : 'Registrar Venta' }}
              </button>
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
  private readonly storage = inject(StorageService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  products: Product[] = [];
  cartItems: SaleItem[] = [];
  searchTerm = '';
  comment = '';
  selectedQty: Record<string, number> = {};

  ngOnInit(): void {
    setTimeout(() => {
      this.products = this.storage.getProducts();
      this.loading.set(false);
    }, 300);
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
    const quantity = Math.max(1, Math.min(this.selectedQty[product.id] ?? 1, maxAvailable));

    if (maxAvailable < 1) {
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
          quantity,
          unitPrice: product.salePrice,
          subtotal: quantity * product.salePrice,
        },
      ];
    }

    this.selectedQty[product.id] = 1;
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      return;
    }

    const product = this.products.find((item) => item.id === productId);
    if (!product || quantity > product.stock) {
      return;
    }

    this.cartItems = this.cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity, subtotal: quantity * item.unitPrice } : item,
    );
  }

  removeItem(productId: string): void {
    this.cartItems = this.cartItems.filter((item) => item.productId !== productId);
  }

  async completeSale(): Promise<void> {
    if (!this.cartItems.length) {
      return;
    }

    this.saving.set(true);

    try {
      const estimatedProfit = this.cartItems.reduce((sum, item) => {
        const product = this.products.find((current) => current.id === item.productId);
        return product ? sum + item.quantity * (item.unitPrice - product.costPrice) : sum;
      }, 0);

      const sale: Sale = {
        id: this.storage.generateSaleId(),
        items: this.cartItems,
        total: this.total,
        estimatedProfit,
        timestamp: new Date(),
        canceled: false,
        comment: this.comment.trim() || undefined,
      };

      this.storage.saveSale(sale);

      for (const cartItem of this.cartItems) {
        const product = this.products.find((item) => item.id === cartItem.productId);
        if (!product) {
          continue;
        }

        this.storage.saveProduct({
          ...product,
          stock: product.stock - cartItem.quantity,
          updatedAt: new Date(),
        });
      }

      await this.router.navigate(['/sales', sale.id]);
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
