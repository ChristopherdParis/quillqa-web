import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FeedbackService } from '../core/feedback.service';
import {
  CreateTenantRequest,
  CreateTenantUserRequest,
  InventoryApiService,
} from '../core/inventory-api.service';
import { FormsModule } from '@angular/forms';
import { TenantSummary, TenantUser } from '../core/models';

@Component({
  selector: 'app-admin-tenants-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <h1>Administracion de Negocios</h1>
        <p>Habilita negocios, genera sus enlaces de acceso y crea usuarios por tenant.</p>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        <div class="stack-lg">
          <article class="card">
            <h2 class="section-title">Nuevo Negocio</h2>
            <div class="form-stack">
              <label class="field">
                <span>Nombre del negocio</span>
                <input [(ngModel)]="tenantForm.name" type="text" />
              </label>
              <label class="field">
                <span>Slug publico</span>
                <input [(ngModel)]="tenantForm.slug" type="text" placeholder="negocio-1" />
              </label>
              <label class="field">
                <span>Correo del owner</span>
                <input [(ngModel)]="tenantForm.ownerEmail" type="email" />
              </label>
              <label class="field">
                <span>Plan</span>
                <select [(ngModel)]="tenantForm.plan">
                  <option value="starter">Starter</option>
                  <option value="team">Team</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <button class="btn btn-primary btn-block" type="button" (click)="createTenant()" [disabled]="savingTenant()">
                {{ savingTenant() ? 'Creando...' : 'Crear negocio' }}
              </button>
            </div>
          </article>

          <section class="stack-md">
            <h2 class="section-title">Negocios Registrados</h2>
            @if (!tenants.length) {
              <div class="card empty-state">Aun no hay negocios creados.</div>
            } @else {
              @for (tenant of tenants; track tenant.id) {
                <article class="card stack-md">
                  <div class="sale-line-item">
                    <div>
                      <h3>{{ tenant.name }}</h3>
                      <p>{{ tenant.slug }} | {{ tenant.plan }} | {{ tenant.status }}</p>
                      <p>{{ buildBusinessUrl(tenant.slug) }}</p>
                    </div>
                    <button class="btn btn-outline" type="button" (click)="toggleUsers(tenant.id)">
                      {{ expandedTenantId() === tenant.id ? 'Ocultar usuarios' : 'Ver usuarios' }}
                    </button>
                  </div>

                  @if (expandedTenantId() === tenant.id) {
                    <div class="stack-md">
                      <div class="form-stack">
                        <label class="field">
                          <span>Nombre del usuario</span>
                          <input [(ngModel)]="userForms[tenant.id].fullName" type="text" />
                        </label>
                        <label class="field">
                          <span>Correo</span>
                          <input [(ngModel)]="userForms[tenant.id].email" type="email" />
                        </label>
                        <label class="field">
                          <span>Rol</span>
                          <select [(ngModel)]="userForms[tenant.id].role">
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        </label>
                        <button class="btn btn-primary btn-block" type="button" (click)="createTenantUser(tenant.id)" [disabled]="savingUserTenantId() === tenant.id">
                          {{ savingUserTenantId() === tenant.id ? 'Guardando...' : 'Crear usuario' }}
                        </button>
                      </div>

                      @if (tenantUsers[tenant.id]?.length) {
                        <div class="table-wrap">
                          <table class="data-table">
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Rol</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (user of tenantUsers[tenant.id]; track user.id) {
                                <tr>
                                  <td>{{ user.fullName }}</td>
                                  <td>{{ user.email }}</td>
                                  <td>{{ user.role }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      } @else {
                        <div class="card empty-state">Este negocio aun no tiene usuarios registrados.</div>
                      }
                    </div>
                  }
                </article>
              }
            }
          </section>
        </div>
      }
    </section>
  `,
})
export class AdminTenantsPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly feedback = inject(FeedbackService);

  readonly loading = signal(true);
  readonly savingTenant = signal(false);
  readonly savingUserTenantId = signal<string | null>(null);
  readonly expandedTenantId = signal<string | null>(null);

  tenants: TenantSummary[] = [];
  tenantUsers: Record<string, TenantUser[]> = {};
  userForms: Record<string, CreateTenantUserRequest> = {};
  tenantForm: CreateTenantRequest = {
    name: '',
    slug: '',
    ownerEmail: '',
    plan: 'starter',
  };

  async ngOnInit(): Promise<void> {
    await this.loadTenants();
  }

  async createTenant(): Promise<void> {
    if (!this.tenantForm.name.trim() || !this.tenantForm.slug.trim() || !this.tenantForm.ownerEmail.trim()) {
      this.feedback.error('Completa nombre, slug y correo del owner.');
      return;
    }

    this.savingTenant.set(true);
    try {
      const tenant = await this.inventoryApi.createTenant({
        ...this.tenantForm,
        name: this.tenantForm.name.trim(),
        slug: this.tenantForm.slug.trim().toLowerCase(),
        ownerEmail: this.tenantForm.ownerEmail.trim(),
      });
      this.tenants = [tenant, ...this.tenants];
      this.initializeUserForm(tenant.id);
      this.tenantForm = { name: '', slug: '', ownerEmail: '', plan: 'starter' };
      this.feedback.success(`Negocio ${tenant.name} creado correctamente.`);
    } catch (error) {
      this.feedback.error(error instanceof Error ? error.message : 'No se pudo crear el negocio.');
    } finally {
      this.savingTenant.set(false);
    }
  }

  async toggleUsers(tenantId: string): Promise<void> {
    if (this.expandedTenantId() === tenantId) {
      this.expandedTenantId.set(null);
      return;
    }

    this.expandedTenantId.set(tenantId);
    this.initializeUserForm(tenantId);
    await this.loadTenantUsers(tenantId);
  }

  async createTenantUser(tenantId: string): Promise<void> {
    const form = this.userForms[tenantId];
    if (!form?.fullName?.trim() || !form?.email?.trim()) {
      this.feedback.error('Completa nombre y correo del usuario.');
      return;
    }

    this.savingUserTenantId.set(tenantId);
    try {
      const user = await this.inventoryApi.createTenantUser(tenantId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
      });
      this.tenantUsers[tenantId] = [user, ...(this.tenantUsers[tenantId] ?? [])];
      this.userForms[tenantId] = { fullName: '', email: '', role: 'staff' };
      this.feedback.success('Usuario creado correctamente.');
    } catch (error) {
      this.feedback.error(error instanceof Error ? error.message : 'No se pudo crear el usuario.');
    } finally {
      this.savingUserTenantId.set(null);
    }
  }

  buildBusinessUrl(slug: string): string {
    return `${window.location.origin}/negocio/${slug}`;
  }

  private async loadTenants(): Promise<void> {
    try {
      this.tenants = await this.inventoryApi.listTenants();
      for (const tenant of this.tenants) {
        this.initializeUserForm(tenant.id);
      }
    } catch {
      this.tenants = [];
      this.feedback.error('No se pudieron cargar los negocios.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTenantUsers(tenantId: string): Promise<void> {
    try {
      this.tenantUsers[tenantId] = await this.inventoryApi.listTenantUsers(tenantId);
    } catch {
      this.tenantUsers[tenantId] = [];
      this.feedback.error('No se pudieron cargar los usuarios del negocio.');
    }
  }

  private initializeUserForm(tenantId: string): void {
    this.userForms[tenantId] ??= {
      fullName: '',
      email: '',
      role: 'staff',
    };
  }
}
