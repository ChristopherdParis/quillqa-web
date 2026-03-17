import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDashboardSummary, InventoryApiService } from '../core/inventory-api.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <div class="page-header page-header-inline">
        <div>
          <h1>Dashboard global</h1>
          <p>Resumen del estado actual del SaaS</p>
        </div>
        <a class="btn btn-primary" routerLink="/admin/tenants">Gestionar negocios</a>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        <div class="metric-grid">
          <article class="card metric-card">
            <p>Negocios creados</p>
            <strong>{{ summary().totalTenants }}</strong>
          </article>
          <article class="card metric-card">
            <p>Negocios activos</p>
            <strong>{{ summary().activeTenants }}</strong>
          </article>
          <article class="card metric-card">
            <p>Plan starter</p>
            <strong>{{ summary().starterTenants }}</strong>
          </article>
          <article class="card metric-card">
            <p>Plan business</p>
            <strong>{{ summary().businessTenants }}</strong>
          </article>
        </div>

        <div class="stack-md">
          <article class="card">
            <h2 class="section-title">Estado del panel admin</h2>
            <p>Negocios y usuarios por negocio ya operan con backend real. Las demas areas quedan estructuradas para integracion gradual.</p>
          </article>

          <article class="card">
            <h2 class="section-title">Siguientes modulos</h2>
            <div class="stack-sm">
              <div class="sale-line-item"><span>Usuarios globales</span><span>Preparado</span></div>
              <div class="sale-line-item"><span>Planes y suscripciones</span><span>Preparado</span></div>
              <div class="sale-line-item"><span>Monitoreo del sistema</span><span>Preparado</span></div>
              <div class="sale-line-item"><span>Configuracion global</span><span>Preparado</span></div>
            </div>
          </article>
        </div>
      }
    </section>
  `,
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);

  readonly loading = signal(true);
  readonly summary = signal<AdminDashboardSummary>({
    totalTenants: 0,
    activeTenants: 0,
    starterTenants: 0,
    teamTenants: 0,
    businessTenants: 0,
  });

  async ngOnInit(): Promise<void> {
    try {
      this.summary.set(await this.inventoryApi.getAdminDashboardSummary());
    } finally {
      this.loading.set(false);
    }
  }
}
