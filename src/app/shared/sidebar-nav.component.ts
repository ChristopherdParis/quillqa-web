import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar desktop-only">
      <div>
        <h1 class="sidebar-title">Mi Tienda</h1>
        <p class="sidebar-subtitle">Sistema de Inventario</p>
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
export class SidebarNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    { path: '/dashboard', label: 'Inicio', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/house.svg' },
    { path: '/products', label: 'Productos', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/package.svg' },
    { path: '/sales', label: 'Ventas', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/shopping-cart.svg' },
    { path: '/reports', label: 'Reportes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/chart-column.svg' },
    { path: '/settings', label: 'Ajustes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/settings.svg' },
  ];
  readonly logoutIcon = 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/log-out.svg';

  handleLogout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
