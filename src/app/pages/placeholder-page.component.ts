import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-narrow">
      <div class="page-header">
        <h1>{{ title }}</h1>
        <p>Vista en migracion desde v0 a Angular</p>
      </div>
      <article class="card empty-state">Esta ruta ya existe en Angular como placeholder para no romper la navegacion.</article>
      <a class="btn btn-outline" routerLink="/dashboard">Volver al dashboard</a>
    </section>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] ?? 'Pendiente';
}
