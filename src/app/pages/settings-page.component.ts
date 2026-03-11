import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BusinessSettings } from '../core/models';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-narrow">
      <div class="page-header">
        <h1>Ajustes</h1>
        <p>Configura tu negocio</p>
      </div>

      @if (loading()) {
        <p class="loading-copy">Cargando...</p>
      } @else {
        <div class="stack-lg">
          <section class="stack-sm">
            <h2 class="section-title">Informacion del Negocio</h2>
            <article class="card">
              <div class="form-stack">
                <label class="field"><span>Nombre del Negocio</span><input [(ngModel)]="settings.name" type="text" /></label>
                <label class="field"><span>Telefono</span><input [(ngModel)]="settings.phone" type="text" /></label>
                <label class="field">
                  <span>Moneda</span>
                  <select [(ngModel)]="settings.currency">
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="MXN">MXN ($)</option>
                    <option value="COP">COP ($)</option>
                    <option value="ARS">ARS ($)</option>
                  </select>
                </label>
                <button class="btn btn-primary btn-block" type="button" (click)="save()" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </article>
          </section>

          <section class="stack-sm">
            <h2 class="section-title">Sesion</h2>
            <button class="btn btn-danger btn-block" type="button" (click)="logout()">Cerrar Sesion</button>
          </section>

          <article class="card app-meta">
            <p>Sistema de Inventario y Ventas</p>
            <small>v1.0.0</small>
          </article>
        </div>
      }
    </section>
  `,
})
export class SettingsPageComponent implements OnInit {
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  settings: BusinessSettings = { name: '', phone: '', currency: 'EUR', userId: '' };

  ngOnInit(): void {
    setTimeout(() => {
      this.settings = this.storage.getBusinessSettings();
      this.loading.set(false);
    }, 300);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.storage.saveBusinessSettings(this.settings);
    this.saving.set(false);
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
