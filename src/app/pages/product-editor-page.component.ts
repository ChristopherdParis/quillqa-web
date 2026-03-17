import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedbackService } from '../core/feedback.service';
import { InventoryApiService } from '../core/inventory-api.service';
import { Product } from '../core/models';

type ProductFormState = {
  name: string;
  code: string;
  unit: string;
  categoryId: string;
  description: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
};

type EditableCategory = {
  id: string;
  name: string;
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
                  <span>SKU / Codigo *</span>
                  <input [(ngModel)]="form.code" name="code" type="text" required placeholder="PROD-001" />
                </label>
                <label class="field">
                  <span>Unidad *</span>
                  <input [(ngModel)]="form.unit" name="unit" type="text" required placeholder="unidad, caja, kg..." />
                </label>
              </div>

              <label class="field">
                <span>Categoria</span>
                <select [(ngModel)]="form.categoryId" name="categoryId">
                  <option value="">Sin categoria</option>
                  @for (category of categories; track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </label>

              <label class="field">
                <span>Descripcion</span>
                <textarea [(ngModel)]="form.description" name="description" rows="2" placeholder="Opcional"></textarea>
              </label>

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
                  <span>Stock inicial (referencial)</span>
                  <input [(ngModel)]="form.stock" name="stock" type="number" min="0" placeholder="0" />
                </label>
                <label class="field">
                  <span>Stock minimo</span>
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
            @if (isEditMode) {
              <button class="btn btn-outline btn-block" type="button" (click)="deleteProduct()" [disabled]="saving()">
                Eliminar Producto
              </button>
            }
            <button class="btn btn-outline btn-block" type="button" (click)="goBack()">Cancelar</button>
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
  private readonly feedback = inject(FeedbackService);
  private readonly inventoryApi = inject(InventoryApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formErrors = signal<string[]>([]);

  categories: EditableCategory[] = [];
  product: Product | null = null;
  isEditMode = false;
  pageTitle = 'Nuevo Producto';

  form: ProductFormState = this.createEmptyForm();

  async ngOnInit(): Promise<void> {
    try {
      const categories = await this.inventoryApi.listCategories();
      this.categories = categories.map((category) => ({ id: category.id, name: category.name }));

      const productId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!productId;
      this.pageTitle = this.isEditMode ? 'Editar Producto' : 'Nuevo Producto';

      if (productId) {
        const product = await this.inventoryApi.getProductForUi(productId);
        if (product) {
          this.product = product;
          this.form = {
            name: product.name,
            code: product.code,
            unit: product.unit ?? 'unidad',
            categoryId: product.categoryId ?? '',
            description: product.description ?? '',
            costPrice: product.costPrice ?? 0,
            salePrice: product.salePrice ?? 0,
            stock: product.stock,
            minStock: product.minStock,
          };
        }
      }
    } catch {
      this.feedback.error('No se pudo cargar la informacion del editor desde backend.');
    } finally {
      this.loading.set(false);
    }
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
      if (this.isEditMode) {
        await this.handleUpdate();
      } else {
        await this.handleCreate();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el producto. Revisa los datos e intenta de nuevo.';
      this.feedback.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteProduct(): Promise<void> {
    if (!this.product) {
      return;
    }

    const shouldDelete = window.confirm(`Eliminar ${this.product.name}? Esta accion no se puede deshacer.`);
    if (!shouldDelete) {
      return;
    }

    this.saving.set(true);
    try {
      await this.inventoryApi.deleteProduct(this.product.id);
      this.feedback.success('Producto eliminado correctamente.');
      await this.router.navigate(['/app/products']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el producto.';
      this.feedback.error(message);
    } finally {
      this.saving.set(false);
    }
  }

  private async handleCreate(): Promise<void> {
    await this.inventoryApi.createProduct({
      sku: this.form.code.trim(),
      name: this.form.name.trim(),
      unit: this.form.unit.trim() || 'unidad',
      unitCost: this.normalizePrice(this.form.costPrice),
      unitSale: this.normalizePrice(this.form.salePrice),
      categoryId: this.form.categoryId || null,
      description: this.form.description.trim() || undefined,
      reorderPoint: this.normalizeQuantity(this.form.minStock),
      active: true,
    });
    this.feedback.success('Producto creado correctamente.');
    await this.router.navigate(['/app/products']);
  }

  private async handleUpdate(): Promise<void> {
    if (!this.product) {
      throw new Error('No se encontro el producto para editar.');
    }

    const description = this.form.description.trim();
    await this.inventoryApi.updateProduct(this.product.id, {
      sku: this.form.code.trim(),
      name: this.form.name.trim(),
      unit: this.form.unit.trim() || 'unidad',
      unitCost: this.normalizePrice(this.form.costPrice),
      unitSale: this.normalizePrice(this.form.salePrice),
      categoryId: this.form.categoryId || null,
      description: description ? description : null,
      reorderPoint: this.normalizeQuantity(this.form.minStock),
    });
    this.feedback.success('Producto actualizado correctamente.');
    await this.router.navigate(['/app/products']);
  }

  private validateForm(): string[] {
    const errors: string[] = [];
    const normalizedName = this.form.name.trim();
    const normalizedCode = this.form.code.trim();
    const normalizedUnit = this.form.unit.trim();
    const price = this.normalizePrice(this.form.costPrice);
    const salePrice = this.normalizePrice(this.form.salePrice);
    const stock = this.normalizeQuantity(this.form.stock);
    const minStock = this.normalizeQuantity(this.form.minStock);

    if (!normalizedName) {
      errors.push('El nombre del producto es obligatorio.');
    }

    if (!normalizedCode) {
      errors.push('El codigo/SKU es obligatorio.');
    }

    if (!normalizedUnit) {
      errors.push('La unidad del producto es obligatoria.');
    }

    if (price < 0) {
      errors.push('El precio de compra no puede ser negativo.');
    }

    if (salePrice < 0) {
      errors.push('El precio de venta no puede ser negativo.');
    }

    if (stock < 0) {
      errors.push('El stock inicial no puede ser negativo.');
    }

    if (minStock < 0) {
      errors.push('El stock minimo no puede ser negativo.');
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

  goBack(): void {
    this.location.back();
  }

  private createEmptyForm(): ProductFormState {
    return {
      name: '',
      code: '',
      unit: 'unidad',
      categoryId: '',
      description: '',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
    };
  }
}
