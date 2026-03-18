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
        <article class="card status-panel centered">
          <div class="status-icon loading" aria-hidden="true">
            <div class="loader-dots"><span></span><span></span><span></span></div>
          </div>
          <h2 class="status-panel-title">Cargando tu catalogo</h2>
          <p class="status-panel-copy">Estamos trayendo productos, categorias y stock disponible.</p>
        </article>
      } @else {
        @if (errorMessage()) {
          <article class="card status-panel">
            <div class="status-icon error" aria-hidden="true">!</div>
            <h2 class="status-panel-title">No se pudo cargar el catalogo</h2>
            <p class="status-panel-copy">{{ errorMessage() }}</p>
            <div class="status-panel-actions">
              <button class="btn btn-primary" type="button" (click)="reload()">Reintentar</button>
              <a class="btn btn-outline" routerLink="/app/settings">Revisar configuracion</a>
            </div>
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
            <article class="card status-panel centered">
              <div class="status-icon empty" aria-hidden="true">{{ hasProducts ? '?' : '+' }}</div>
              <h2 class="status-panel-title">{{ hasProducts ? 'No hay coincidencias para este filtro' : 'Tu catalogo esta vacio' }}</h2>
              <p class="status-panel-copy">
                {{ hasProducts ? 'Prueba con otra busqueda o cambia de pestaña para ver mas productos.' : 'Crea tu primer producto para comenzar a registrar inventario y ventas.' }}
              </p>
              <div class="status-panel-actions">
                @if (hasProducts) {
                  <button class="btn btn-outline" type="button" (click)="clearFilters()">Limpiar filtros</button>
                } @else {
                  <a class="btn btn-primary" routerLink="/app/products/new">Crear primer producto</a>
                }
              </div>
            </article>
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
  readonly errorMessage = signal('');
  searchTerm = '';
  activeTab: ProductTab = 'all';
  products: Product[] = [];

  constructor(private readonly inventoryApi: InventoryApiService, private readonly feedback: FeedbackService) {}

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
  }

  async reload(): Promise<void> {
    await this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    this.loading.set(true);
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

  get hasProducts(): boolean {
    return this.products.length > 0;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeTab = 'all';
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
