import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LayoutShellComponent } from './layout-shell.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { PlaceholderPageComponent } from './pages/placeholder-page.component';
import { ProductEditorPageComponent } from './pages/product-editor-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { ReportsPageComponent } from './pages/reports-page.component';
import { SaleDetailPageComponent } from './pages/sale-detail-page.component';
import { SaleEditorPageComponent } from './pages/sale-editor-page.component';
import { SalesPageComponent } from './pages/sales-page.component';
import { SettingsPageComponent } from './pages/settings-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: LayoutShellComponent,
    canActivate: [authGuard],
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
  { path: '**', redirectTo: '' },
];
