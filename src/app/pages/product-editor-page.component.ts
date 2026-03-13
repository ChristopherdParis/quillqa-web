import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../core/models';
import { StorageService } from '../core/storage.service';
import { FeedbackService } from '../core/feedback.service';

type ProductFormState = {
  name: string;
  code: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
};

@Component({
  selector: 'app-product-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-narrow">
      <div class="editor-header mobile-only">
        <button class="btn btn-ghost btn-icon" type="button" (click)="goBack()">&lt;</button>
        <h1>{{ pageTitle }}</h1>
      </div>

      <div class="page-header desktop-only">
        <h1>{{ pageTitle }}</h1>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else if (isEditMode && !product) {
        <div class="card empty-state">Producto no encontrado</div>
      } @else {
        <form class="form-stack" (ngSubmit)="save()">
          <article class="card">
            <div class="form-stack">
              <label class="field">
                <span>Nombre del Producto *</span>
                <input [(ngModel)]="form.name" name="name" type="text" required placeholder="Ej. Tornillos 1/2&quot;" />
              </label>

              <div class="form-grid">
                <label class="field">
                  <span>Codigo</span>
                  <input [(ngModel)]="form.code" name="code" type="text" placeholder="PROD-001" />
                </label>
                <label class="field">
                  <span>Categoria</span>
                  <select [(ngModel)]="form.category" name="category">
                    <option value="">Selecciona</option>
                    @for (category of categories; track category) {
                      <option [value]="category">{{ category }}</option>
                    }
                  </select>
                </label>
              </div>

              <div class="form-grid">
                <label class="field">
                  <span>Precio Compra</span>
                  <input [(ngModel)]="form.costPrice" name="costPrice" type="number" min="0" step="0.01" placeholder="0.00" />
                </label>
                <label class="field">
                  <span>Precio Venta</span>
                  <input [(ngModel)]="form.salePrice" name="salePrice" type="number" min="0" step="0.01" placeholder="0.00" />
                </label>
              </div>

              <div class="form-grid">
                <label class="field">
                  <span>Stock Actual</span>
                  <input [(ngModel)]="form.stock" name="stock" type="number" min="0" placeholder="0" />
                </label>
                <label class="field">
                  <span>Stock Minimo</span>
                  <input [(ngModel)]="form.minStock" name="minStock" type="number" min="0" placeholder="5" />
                </label>
              </div>
            </div>
          </article>

          @if (formErrors().length) {
            <article class="card validation-summary">
              <h3 class="validation-title">Corrige estos campos:</h3>
              <ul>
                @for (message of formErrors(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </article>
          }

          <div class="form-actions">
            <button class="btn btn-primary btn-block" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : isEditMode ? 'Actualizar Producto' : 'Crear Producto' }}
            </button>
            <button class="btn btn-outline btn-block" type="button" (click)="goBack()">Cancelar</button>
            @if (isEditMode && product) {
              <button class="btn btn-danger btn-block" type="button" (click)="remove()">Eliminar Producto</button>
            }
          </div>
        </form>
      }
    </section>
  `,
})
export class ProductEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly storage = inject(StorageService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formErrors = signal<string[]>([]);

  readonly categories = ['Tornillos', 'Herramientas', 'Accesorios', 'Iluminacion', 'Bebidas', 'Alimentos', 'Electronica', 'Otros'];

  product: Product | null = null;
  isEditMode = false;
  pageTitle = 'Nuevo Producto';
  form: ProductFormState = this.createEmptyForm();

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!productId;
    this.pageTitle = this.isEditMode ? 'Editar Producto' : 'Nuevo Producto';

    setTimeout(() => {
      if (productId) {
        this.product = this.storage.getProductById(productId);
        if (this.product) {
          this.form = {
            name: this.product.name,
            code: this.product.code,
            category: this.product.category,
            costPrice: this.product.costPrice,
            salePrice: this.product.salePrice,
            stock: this.product.stock,
            minStock: this.product.minStock,
          };
        }
      }

      this.loading.set(false);
    }, 300);
  }

  async save(): Promise<void> {
    const errors = this.validateForm();
    if (errors.length) {
      this.formErrors.set(errors);
      this.feedback.error('Corrige los datos del producto antes de continuar.');
      return;
    }

    this.formErrors.set([]);

    this.saving.set(true);

    try {
      const normalizedCostPrice = this.normalizePrice(this.form.costPrice);
      const normalizedSalePrice = this.normalizePrice(this.form.salePrice);
      const normalizedStock = this.normalizeQuantity(this.form.stock);
      const normalizedMinStock = this.normalizeQuantity(this.form.minStock);
      const now = new Date();
      const product: Product = {
        id: this.product?.id ?? String(Date.now()),
        name: this.form.name.trim(),
        code: this.form.code.trim(),
        category: this.form.category,
        costPrice: normalizedCostPrice,
        salePrice: normalizedSalePrice,
        stock: normalizedStock,
        minStock: normalizedMinStock,
        createdAt: this.product?.createdAt ?? now,
        updatedAt: now,
      };

      this.storage.saveProduct(product);
      this.feedback.success(this.isEditMode ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      await this.router.navigate(['/products']);
    } catch {
      this.feedback.error('No se pudo guardar el producto. Revisa los datos e intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  private readonly feedback = inject(FeedbackService);

  private validateForm(): string[] {
    const errors: string[] = [];
    const normalizedName = this.form.name.trim();
    const normalizedCode = this.form.code.trim().toLowerCase();
    const price = this.normalizePrice(this.form.costPrice);
    const salePrice = this.normalizePrice(this.form.salePrice);
    const stock = this.normalizeQuantity(this.form.stock);
    const minStock = this.normalizeQuantity(this.form.minStock);

    if (!normalizedName) {
      errors.push('El nombre del producto es obligatorio.');
    }

    if (!this.form.code.trim()) {
      errors.push('El código es recomendado para identificar inventario.');
    }

    if (price < 0) {
      errors.push('El precio de compra no puede ser negativo.');
    }

    if (salePrice <= 0) {
      errors.push('El precio de venta debe ser mayor a 0.');
    }

    if (salePrice < price) {
      errors.push('El precio de venta debe ser mayor o igual al precio de compra.');
    }

    if (stock < 0) {
      errors.push('El stock actual no puede ser negativo.');
    }

    if (minStock < 0) {
      errors.push('El stock mínimo no puede ser negativo.');
    }

    if (this.product) {
      const products = this.storage.getProducts().filter((item) => item.id !== this.product?.id);
      const hasDuplicateCode = products.some((item) => item.code.trim().toLowerCase() === normalizedCode && !!normalizedCode);
      if (hasDuplicateCode) {
        errors.push('Ya existe otro producto con ese código.');
      }
    } else {
      const products = this.storage.getProducts();
      const hasDuplicateCode = products.some((item) => item.code.trim().toLowerCase() === normalizedCode && !!normalizedCode);
      if (hasDuplicateCode) {
        errors.push('Ya existe un producto con ese código.');
      }
    }

    return errors;
  }

  private normalizePrice(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : -1;
  }

  private normalizeQuantity(value: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : -1;
  }

  async remove(): Promise<void> {
    if (!this.product) {
      return;
    }

    const shouldDelete = window.confirm(`Eliminar "${this.product.name}"? Esta accion no se puede deshacer.`);
    if (!shouldDelete) {
      return;
    }

    try {
      this.storage.deleteProduct(this.product.id);
      this.feedback.success('Producto eliminado correctamente.');
      await this.router.navigate(['/products']);
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }

  private createEmptyForm(): ProductFormState {
    return {
      name: '',
      code: '',
      category: '',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
    };
  }
}
