import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav mobile-only">
      @for (item of navItems; track item.path) {
        <a class="bottom-nav-link" [routerLink]="item.path" routerLinkActive="active">
          <img class="bottom-nav-icon lucide-icon" [src]="item.icon" [alt]="item.label" width="18" height="18" />
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class AppBottomNavComponent {
  readonly navItems = [
    { path: '/app/dashboard', label: 'Inicio', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/house.svg' },
    { path: '/app/products', label: 'Productos', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/package.svg' },
    { path: '/app/sales', label: 'Ventas', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/shopping-cart.svg' },
    { path: '/app/reports', label: 'Reportes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/chart-column.svg' },
    { path: '/app/settings', label: 'Ajustes', icon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.563.0/icons/settings.svg' },
  ];
}
