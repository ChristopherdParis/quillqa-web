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
          <h1>Mi Tienda</h1>
          <p>Inventario y Ventas</p>
        </div>

        <form class="form-stack" (ngSubmit)="submit()">
          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <label class="field">
            <span>Correo o Usuario</span>
            <input [(ngModel)]="email" name="email" type="email" placeholder="Ingresa tu correo" />
          </label>

          <label class="field">
            <span>Contrasena</span>
            <input [(ngModel)]="password" name="password" type="password" placeholder="Ingresa tu contrasena" />
          </label>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>

          <div class="auth-footer">Demo: demo@tienda.es / demo123</div>
        </form>
      </div>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = 'demo@tienda.es';
  password = 'demo123';
  readonly error = signal('');
  readonly loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Error al iniciar sesion');
    } finally {
      this.loading.set(false);
    }
  }
}
