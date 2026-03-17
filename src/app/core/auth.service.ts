import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAppAuthenticated = signal(false);
  readonly isAdminAuthenticated = signal(false);
  readonly isLoading = signal(true);
  private readonly defaultAppCredentials = {
    user: 'demo@tienda.es',
    password: 'demo123',
  };
  private readonly defaultAdminCredentials = {
    user: 'admin@quillqa.com',
    password: 'admin123',
  };

  constructor(private readonly storage: StorageService) {
    this.storage.initializeStorage();
    const appToken = this.storage.getAppAuthToken();
    const adminToken = this.storage.getAdminAuthToken();
    this.isAppAuthenticated.set(!!appToken);
    this.isAdminAuthenticated.set(!!adminToken);
    this.isLoading.set(false);
  }

  async loginApp(user: string, password: string): Promise<void> {
    this.isLoading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!this.validateAppCredentials(user, password)) {
      this.isLoading.set(false);
      throw new Error('Usuario o contrasena incorrectos');
    }

    this.storage.setAppAuthToken(`app-token-${Date.now()}`, 8, 'business');
    this.isAppAuthenticated.set(true);
    this.isLoading.set(false);
  }

  async loginAdmin(user: string, password: string): Promise<void> {
    this.isLoading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!this.validateAdminCredentials(user, password)) {
      this.isLoading.set(false);
      throw new Error('Credenciales de superadmin incorrectas');
    }

    this.storage.setAdminAuthToken(`admin-token-${Date.now()}`, 8, 'admin');
    this.isAdminAuthenticated.set(true);
    this.isLoading.set(false);
  }

  getDefaultAppCredentials(): { user: string; password: string } {
    return { ...this.defaultAppCredentials };
  }

  getDefaultAdminCredentials(): { user: string; password: string } {
    return { ...this.defaultAdminCredentials };
  }

  validateAppCredentials(user: string, password: string): boolean {
    return user.trim() === this.defaultAppCredentials.user && password === this.defaultAppCredentials.password;
  }

  validateAdminCredentials(user: string, password: string): boolean {
    return user.trim() === this.defaultAdminCredentials.user && password === this.defaultAdminCredentials.password;
  }

  logoutApp(): void {
    this.storage.clearAppAuthToken();
    this.isAppAuthenticated.set(false);
  }

  logoutAdmin(): void {
    this.storage.clearAdminAuthToken();
    this.isAdminAuthenticated.set(false);
  }
}
