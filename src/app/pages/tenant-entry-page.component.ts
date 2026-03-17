import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryApiService } from '../core/inventory-api.service';
import { StorageService } from '../core/storage.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-tenant-entry-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page page-narrow">
      @if (loading()) {
        <p class="loading-copy">Preparando acceso al negocio...</p>
      } @else if (error()) {
        <div class="card empty-state">{{ error() }}</div>
      }
    </section>
  `,
})
export class TenantEntryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug')?.trim().toLowerCase();
    if (!slug) {
      this.error.set('Enlace de negocio no valido.');
      this.loading.set(false);
      return;
    }

    try {
      const tenant = await this.inventoryApi.getTenantBySlug(slug);
      if (!tenant) {
        this.error.set('No se encontro el negocio solicitado.');
        return;
      }

      this.storage.saveActiveTenantId(tenant.id);
      const settings = this.storage.getBusinessSettings();
      this.storage.saveBusinessSettings({
        ...settings,
        name: tenant.name,
        tenantId: tenant.id,
      });

      await this.router.navigate([this.auth.isAppAuthenticated() ? '/app/dashboard' : '/login']);
    } catch {
      this.error.set('No se pudo preparar el acceso al negocio.');
    } finally {
      this.loading.set(false);
    }
  }
}
