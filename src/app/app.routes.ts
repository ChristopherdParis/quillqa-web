import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';
import { AppShellComponent } from './app-shell.component';
import { adminAuthGuard } from './core/admin-auth.guard';
import { appAuthGuard } from './core/app-auth.guard';
import { tenantContextGuard } from './core/tenant-context.guard';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page.component';
import { AdminTenantsPageComponent } from './pages/admin-tenants-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { PlaceholderPageComponent } from './pages/placeholder-page.component';
import { ProductEditorPageComponent } from './pages/product-editor-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { ReportsPageComponent } from './pages/reports-page.component';
import { RootRedirectPageComponent } from './pages/root-redirect-page.component';
import { SaleDetailPageComponent } from './pages/sale-detail-page.component';
import { SaleEditorPageComponent } from './pages/sale-editor-page.component';
import { SalesPageComponent } from './pages/sales-page.component';
import { SettingsPageComponent } from './pages/settings-page.component';
import { TenantEntryPageComponent } from './pages/tenant-entry-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: RootRedirectPageComponent },
  { path: 'negocio/:slug', component: TenantEntryPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'admin/login', component: AdminLoginPageComponent },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [appAuthGuard, tenantContextGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'products/new', component: ProductEditorPageComponent },
      { path: 'products/:id', component: ProductEditorPageComponent },
      { path: 'sales', component: SalesPageComponent },
      { path: 'sales/new', component: SaleEditorPageComponent },
      { path: 'sales/:id', component: SaleDetailPageComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: 'settings', component: SettingsPageComponent },
    ],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardPageComponent },
      { path: 'tenants', component: AdminTenantsPageComponent },
      {
        path: 'users',
        component: PlaceholderPageComponent,
        data: {
          title: 'Usuarios globales',
          description: 'Gestion centralizada de acceso y operadores del SaaS.',
          message: 'Esta seccion queda lista para integrar usuarios globales o soporte interno.',
          backLink: '/admin/dashboard',
          backLabel: 'Volver al panel admin',
        },
      },
      {
        path: 'plans',
        component: PlaceholderPageComponent,
        data: {
          title: 'Planes y suscripciones',
          description: 'Catalogo comercial y control de suscripciones del SaaS.',
          message: 'La estructura de navegacion ya esta separada; falta integrar facturacion y reglas de plan.',
          backLink: '/admin/dashboard',
          backLabel: 'Volver al panel admin',
        },
      },
      {
        path: 'monitoring',
        component: PlaceholderPageComponent,
        data: {
          title: 'Monitoreo del sistema',
          description: 'Salud operativa, servicios y eventos criticos.',
          message: 'Este modulo queda reservado para checks de salud, logs y alertas de plataforma.',
          backLink: '/admin/dashboard',
          backLabel: 'Volver al panel admin',
        },
      },
      {
        path: 'settings',
        component: PlaceholderPageComponent,
        data: {
          title: 'Configuracion global',
          description: 'Parametros globales y defaults del SaaS.',
          message: 'Esta vista queda preparada para branding, correo transaccional y ajustes globales.',
          backLink: '/admin/dashboard',
          backLabel: 'Volver al panel admin',
        },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
