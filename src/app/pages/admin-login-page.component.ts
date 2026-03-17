import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-auth-page">
      <div class="admin-auth-card">
        <p class="admin-auth-kicker">Superadministracion SaaS</p>
        <h1>Acceso de plataforma</h1>
        <p class="admin-auth-copy">Ingresa al panel global para habilitar negocios y operar el sistema.</p>

        <form class="form-stack" (ngSubmit)="submit()">
          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <label class="field">
            <span>Correo admin</span>
            <input [(ngModel)]="user" name="user" type="email" autocomplete="username" [disabled]="loading()" />
          </label>

          <label class="field">
            <span>Contrasena</span>
            <input [(ngModel)]="password" name="password" type="password" autocomplete="current-password" [disabled]="loading()" />
          </label>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Entrar al panel admin' }}
          </button>

          <div class="auth-footer">
            <p>Credenciales demo de superadmin</p>
            <p><strong>Usuario:</strong> {{ defaultCredentials.user }}</p>
            <p><strong>Contrasena:</strong> {{ defaultCredentials.password }}</p>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(240, 208, 140, 0.2), transparent 30%),
        linear-gradient(180deg, #09111f 0%, #0f1d34 100%);
    }

    .admin-auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
    }

    .admin-auth-card {
      width: min(100%, 28rem);
      padding: 2rem;
      border-radius: 1.5rem;
      background: rgba(11, 18, 32, 0.86);
      border: 1px solid rgba(240, 208, 140, 0.24);
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.32);
      color: #f5f7fb;
    }

    .admin-auth-kicker {
      margin: 0 0 0.5rem;
      text-transform: uppercase;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      color: #f0d08c;
    }

    .admin-auth-card h1 {
      margin: 0;
    }

    .admin-auth-copy {
      margin: 0.75rem 0 1.5rem;
      color: rgba(245, 247, 251, 0.72);
    }
  `],
})
export class AdminLoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  user = '';
  password = '';
  readonly defaultCredentials = this.auth.getDefaultAdminCredentials();
  readonly error = signal('');
  readonly loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    const normalizedUser = this.user.trim();
    const normalizedPassword = this.password.trim();

    if (!normalizedUser || !normalizedPassword) {
      this.error.set('Completa correo y contrasena.');
      return;
    }

    this.loading.set(true);

    try {
      await this.auth.loginAdmin(normalizedUser, normalizedPassword);
      await this.router.navigate(['/admin/tenants']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Credenciales invalidas');
    } finally {
      this.loading.set(false);
    }
  }
}
