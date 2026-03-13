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
          <h1>Acceso a Mi Tienda</h1>
          <p>Ingresa para gestionar inventario y ventas</p>
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
            <span>Contrase\u00f1a</span>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Ingresa tu contrase\u00f1a"
              [disabled]="loading()"
            />
          </label>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>

          <div class="auth-footer">
            <p>Credenciales de prueba para acceso inicial</p>
            <p><strong>Usuario:</strong> {{ defaultCredentials.user }}</p>
            <p><strong>Contrase\u00f1a:</strong> {{ defaultCredentials.password }}</p>
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
  readonly defaultCredentials = this.auth.getDefaultCredentials();
  readonly error = signal('');
  readonly loading = signal(false);
  readonly minPasswordLength = 6;

  async submit(): Promise<void> {
    this.error.set('');

    const normalizedUser = this.user.trim();
    const normalizedPassword = this.password.trim();

    if (!normalizedUser || !normalizedPassword || normalizedPassword.length < this.minPasswordLength) {
      this.error.set('Completa usuario y contrase\u00f1a');
      return;
    }

    this.loading.set(true);

    try {
      await this.auth.login(normalizedUser, normalizedPassword);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Usuario o contrase\u00f1a incorrectos');
    } finally {
      this.loading.set(false);
    }
  }
}
