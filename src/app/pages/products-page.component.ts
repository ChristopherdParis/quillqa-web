import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { InventoryApiService } from '../core/inventory-api.service';
import { FeedbackService } from '../core/feedback.service';

type ProductTab = 'all' | 'low' | 'out';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header page-header-inline">
        <div>
          <h1>Productos</h1>
          <p>Gestiona tu inventario</p>
        </div>
        <a class="btn btn-primary" routerLink="/app/products/new">Nuevo Producto</a>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        @if (errorMessage()) {
          <article class="card validation-summary">
            <h3 class="validation-title">No se pudo cargar desde backend</h3>
            <p>{{ errorMessage() }}</p>
          </article>
        }

        <div class="stack-md">
          <input [(ngModel)]="searchTerm" class="search-input" type="text" placeholder="Buscar por nombre o codigo..." />

          <div class="tabs">
            <button class="tab-button" [class.active]="activeTab === 'all'" type="button" (click)="activeTab = 'all'">Todos</button>
            <button class="tab-button" [class.active]="activeTab === 'low'" type="button" (click)="activeTab = 'low'">Bajo Stock</button>
            <button class="tab-button" [class.active]="activeTab === 'out'" type="button" (click)="activeTab = 'out'">Agotados</button>
          </div>

          @if (!visibleProducts.length) {
            <div class="card empty-state">No hay productos para este filtro</div>
          } @else {
            <div class="mobile-only stack-sm">
              @for (product of visibleProducts; track product.id) {
                <a class="card list-card" [routerLink]="['/app/products', product.id]">
                  <div>
                    <h3>{{ product.name }}</h3>
                    <p>Stock: {{ product.stock }} | {{ product.salePrice.toFixed(2) }} EUR</p>
                  </div>
                  <span class="link-arrow">&gt;</span>
                </a>
              }
            </div>

            <div class="desktop-only table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Producto</th>
                    <th>Categoria</th>
                    <th>Costo</th>
                    <th>Venta</th>
                    <th>Stock</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of visibleProducts; track product.id) {
                    <tr>
                      <td>{{ product.code }}</td>
                      <td>{{ product.name }}</td>
                      <td>{{ product.category }}</td>
                      <td>{{ product.costPrice.toFixed(2) }}</td>
                      <td>{{ product.salePrice.toFixed(2) }}</td>
                      <td>
                        <span class="pill" [class.pill-danger]="product.stock === 0" [class.pill-warn]="product.stock > 0 && product.stock <= product.minStock">
                          {{ product.stock }}
                        </span>
                      </td>
                      <td class="text-right">
                        <a class="btn btn-ghost" [routerLink]="['/app/products', product.id]">Editar</a>
                        <button class="btn btn-outline" type="button" (click)="deleteProduct(product.id, $event)">Eliminar</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class ProductsPageComponent implements OnInit {
  readonly loading = signal(true);
  searchTerm = '';
  activeTab: ProductTab = 'all';
  products: Product[] = [];

  readonly errorMessage = signal('');

  constructor(private readonly inventoryApi: InventoryApiService, private readonly feedback: FeedbackService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.products = await this.inventoryApi.listProductCatalogForUi();
      this.errorMessage.set('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el catalogo desde el backend.';
      this.errorMessage.set(message);
      this.feedback.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProduct(productId: string, event: Event): Promise<void> {
    event.preventDefault();
    const shouldDelete = window.confirm('Seguro que deseas eliminar este producto?');
    if (!shouldDelete) {
      return;
    }

    try {
      await this.inventoryApi.deleteProduct(productId);
      this.products = this.products.filter((product) => product.id !== productId);
      this.feedback.success('Producto eliminado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el producto.';
      this.feedback.error(message);
    }
  }

  get visibleProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.products.filter((product) => !term || product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term));

    if (this.activeTab === 'low') {
      return filtered.filter((product) => product.stock > 0 && product.stock <= product.minStock);
    }
    if (this.activeTab === 'out') {
      return filtered.filter((product) => product.stock === 0);
    }
    return filtered;
  }
}
