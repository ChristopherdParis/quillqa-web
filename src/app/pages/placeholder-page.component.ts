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
        <p>{{ description }}</p>
      </div>
      <article class="card empty-state">{{ message }}</article>
      <a class="btn btn-outline" [routerLink]="backLink">{{ backLabel }}</a>
    </section>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] ?? 'Pendiente';
  readonly description = this.route.snapshot.data['description'] ?? 'Vista temporal disponible para no romper la navegacion.';
  readonly message = this.route.snapshot.data['message'] ?? 'Esta seccion queda preparada para la siguiente fase.';
  readonly backLink = this.route.snapshot.data['backLink'] ?? '/app/dashboard';
  readonly backLabel = this.route.snapshot.data['backLabel'] ?? 'Volver al dashboard';
}
