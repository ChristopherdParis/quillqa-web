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
    if (!this.form.name.trim()) {
      this.feedback.error('El nombre del producto es obligatorio.');
      return;
    }

    if (this.form.costPrice < 0 || this.form.salePrice < 0 || this.form.stock < 0 || this.form.minStock < 0) {
      this.feedback.error('No se permiten valores negativos.');
      return;
    }

    this.saving.set(true);

    try {
      const now = new Date();
      const product: Product = {
        id: this.product?.id ?? String(Date.now()),
        name: this.form.name.trim(),
        code: this.form.code.trim(),
        category: this.form.category,
        costPrice: Number(this.form.costPrice) || 0,
        salePrice: Number(this.form.salePrice) || 0,
        stock: Number(this.form.stock) || 0,
        minStock: Number(this.form.minStock) || 5,
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
