import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(true);
  private readonly defaultCredentials = {
    user: 'demo@tienda.es',
    password: 'demo123',
  };

  constructor(private readonly storage: StorageService) {
    this.storage.initializeStorage();
    const token = this.storage.getAuthToken();
    this.isAuthenticated.set(!!token);
    this.isLoading.set(false);
  }

  async login(user: string, password: string): Promise<void> {
    this.isLoading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!this.validateCredentials(user, password)) {
      this.isLoading.set(false);
      throw new Error('Usuario o contrase\u00f1a incorrectos');
    }

    this.storage.setAuthToken(`demo-token-${Date.now()}`, 8);
    this.isAuthenticated.set(true);
    this.isLoading.set(false);
  }

  getDefaultCredentials(): { user: string; password: string } {
    return { ...this.defaultCredentials };
  }

  validateCredentials(user: string, password: string): boolean {
    return user.trim() === this.defaultCredentials.user && password === this.defaultCredentials.password;
  }

  logout(): void {
    this.storage.clearAuthToken();
    this.isAuthenticated.set(false);
  }
}
