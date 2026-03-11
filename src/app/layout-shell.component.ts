import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { SidebarNavComponent } from './shared/sidebar-nav.component';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, BottomNavComponent],
  template: `
    <div class="app-shell">
      <app-sidebar-nav />
      <main class="content-area">
        <router-outlet />
      </main>
      <app-bottom-nav />
    </div>
  `,
})
export class LayoutShellComponent {}
