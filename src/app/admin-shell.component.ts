import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarNavComponent } from './shared/admin-sidebar-nav.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarNavComponent],
  template: `
    <div class="admin-shell">
      <app-admin-sidebar-nav />
      <div class="admin-content">
        <header class="admin-topbar">
          <div>
            <p class="admin-kicker">Superadministracion</p>
            <h1>Panel SaaS</h1>
          </div>
          <p class="admin-topbar-copy">Vista global de negocios, usuarios y operacion del sistema.</p>
        </header>
        <main class="admin-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(240, 208, 140, 0.18), transparent 28%),
        linear-gradient(180deg, #0b1220 0%, #10192d 100%);
      color: #f5f7fb;
    }

    .admin-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
    }

    .admin-content {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .admin-topbar {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 2rem 2.5rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(11, 18, 32, 0.72);
      backdrop-filter: blur(12px);
    }

    .admin-kicker {
      margin: 0 0 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      color: #f0d08c;
    }

    .admin-topbar h1 {
      margin: 0;
      font-size: 1.9rem;
    }

    .admin-topbar-copy {
      margin: 0;
      max-width: 32rem;
      color: rgba(245, 247, 251, 0.7);
      align-self: center;
      text-align: right;
    }

    .admin-main {
      flex: 1;
      padding: 1.5rem 2.5rem 2.5rem;
    }

    @media (max-width: 960px) {
      .admin-shell {
        grid-template-columns: 1fr;
      }

      .admin-topbar {
        padding: 1.25rem 1rem 0.75rem;
        flex-direction: column;
      }

      .admin-topbar-copy {
        text-align: left;
      }

      .admin-main {
        padding: 1rem;
      }
    }
  `],
})
export class AdminShellComponent {}
