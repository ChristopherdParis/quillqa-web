import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-admin-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <p class="admin-brand-kicker">SaaS</p>
        <h2>Quillqa Control</h2>
        <span>Superadmin</span>
      </div>

      <nav class="admin-nav">
        @for (item of navItems; track item.path) {
          <a class="admin-nav-link" [routerLink]="item.path" routerLinkActive="active">
            <img class="admin-nav-icon lucide-icon" [src]="item.icon" [alt]="item.label" width="18" height="18" />
            <div>
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </div>
          </a>
        }
      </nav>

      <button class="btn btn-outline btn-block" type="button" (click)="handleLogout()">Cerrar sesion</button>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      background: rgba(6, 12, 23, 0.92);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .admin-sidebar {
      min-height: 100vh;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: sticky;
      top: 0;
    }

    .admin-brand {
      padding: 1rem;
      border-radius: 1rem;
      background: linear-gradient(160deg, rgba(240, 208, 140, 0.16), rgba(255, 255, 255, 0.04));
      border: 1px solid rgba(240, 208, 140, 0.18);
    }

    .admin-brand-kicker,
    .admin-brand span,
    .admin-nav-link small {
      color: rgba(245, 247, 251, 0.68);
    }

    .admin-brand-kicker {
      margin: 0 0 0.35rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #f0d08c;
    }

    .admin-brand h2 {
      margin: 0 0 0.25rem;
    }

    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .admin-nav-link {
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 0.75rem;
      padding: 0.85rem 0.9rem;
      border-radius: 0.85rem;
      color: #f5f7fb;
      text-decoration: none;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
    }

    .admin-nav-link.active {
      background: rgba(240, 208, 140, 0.12);
      border-color: rgba(240, 208, 140, 0.28);
    }

    .admin-nav-link strong,
    .admin-nav-link small {
      display: block;
    }

    @media (max-width: 960px) {
      .admin-sidebar {
        min-height: auto;
        position: static;
      }
    }
  `],
})
export class AdminSidebarNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      description: 'Vista general del SaaS',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/layout-dashboard.svg',
    },
    {
      path: '/admin/tenants',
      label: 'Negocios',
      description: 'Alta y gestion de tenants',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/building-2.svg',
    },
    {
      path: '/admin/users',
      label: 'Usuarios',
      description: 'Acceso global del SaaS',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/users.svg',
    },
    {
      path: '/admin/plans',
      label: 'Planes',
      description: 'Suscripciones y catalogo',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/badge-dollar-sign.svg',
    },
    {
      path: '/admin/monitoring',
      label: 'Monitoreo',
      description: 'Salud y estado del sistema',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/activity.svg',
    },
    {
      path: '/admin/settings',
      label: 'Configuracion',
      description: 'Parametros globales',
      icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/settings.svg',
    },
  ];

  handleLogout(): void {
    this.auth.logoutAdmin();
    void this.router.navigate(['/admin/login']);
  }
}
