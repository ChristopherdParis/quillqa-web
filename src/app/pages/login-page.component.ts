import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Acceso del Negocio</h1>
          <p>Ingresa al sistema operativo de inventario de tu negocio</p>
        </div>

        <form class="form-stack" (ngSubmit)="submit()">
          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <label class="field">
            <span>Usuario</span>
            <input
              [(ngModel)]="user"
              name="user"
              type="text"
              autocomplete="username"
              placeholder="Correo o usuario"
              [disabled]="loading()"
            />
          </label>

          <label class="field">
            <span>Contrasena</span>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Ingresa tu contrasena"
              [disabled]="loading()"
            />
          </label>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>

          <div class="auth-footer">
            <p>Credenciales de prueba para acceso inicial</p>
            <p><strong>Usuario:</strong> {{ defaultCredentials.user }}</p>
            <p><strong>Contrasena:</strong> {{ defaultCredentials.password }}</p>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  user = '';
  password = '';
  readonly defaultCredentials = this.auth.getDefaultAppCredentials();
  readonly error = signal('');
  readonly loading = signal(false);
  readonly minPasswordLength = 6;

  async submit(): Promise<void> {
    this.error.set('');

    const normalizedUser = this.user.trim();
    const normalizedPassword = this.password.trim();

    if (!normalizedUser || !normalizedPassword || normalizedPassword.length < this.minPasswordLength) {
      this.error.set('Completa usuario y contrasena');
      return;
    }

    this.loading.set(true);

    try {
      await this.auth.loginApp(normalizedUser, normalizedPassword);
      await this.router.navigate(['/app/dashboard']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Usuario o contrasena incorrectos');
    } finally {
      this.loading.set(false);
    }
  }
}
