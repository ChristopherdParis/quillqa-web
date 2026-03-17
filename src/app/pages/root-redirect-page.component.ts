import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-root-redirect-page',
  standalone: true,
  template: '',
})
export class RootRedirectPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    if (this.auth.isAdminAuthenticated()) {
      await this.router.navigate(['/admin/tenants']);
      return;
    }

    if (this.auth.isAppAuthenticated()) {
      await this.router.navigate(['/app/dashboard']);
      return;
    }

    await this.router.navigate(['/admin/login']);
  }
}
