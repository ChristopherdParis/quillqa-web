import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'app-app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar desktop-only">
      <div>
        <h1 class="sidebar-title">{{ businessName }}</h1>
        <p class="sidebar-subtitle">Inventario del negocio</p>
      </div>

      <nav class="sidebar-nav">
        @for (item of navItems; track item.path) {
          <a class="nav-link" [routerLink]="item.path" routerLinkActive="active">
            <img class="nav-icon lucide-icon" [src]="item.icon" [alt]="item.label" width="18" height="18" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <button class="btn btn-outline btn-block" type="button" (click)="handleLogout()">
        <img class="nav-icon lucide-icon" [src]="logoutIcon" alt="Cerrar sesion" width="18" height="18" />
        <span>Cerrar sesion</span>
      </button>
    </aside>
  `,
})
export class AppSidebarNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  readonly navItems = [
    { path: '/app/dashboard', label: 'Inicio', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/house.svg' },
    { path: '/app/products', label: 'Productos', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/package.svg' },
    { path: '/app/sales', label: 'Ventas', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/shopping-cart.svg' },
    { path: '/app/reports', label: 'Reportes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/chart-column.svg' },
    { path: '/app/settings', label: 'Ajustes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/settings.svg' },
  ];
  readonly logoutIcon = 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/log-out.svg';

  get businessName(): string {
    return this.storage.getBusinessSettings().name?.trim() || 'Mi Negocio';
  }

  handleLogout(): void {
    this.auth.logoutApp();
    void this.router.navigate(['/login']);
  }
}
