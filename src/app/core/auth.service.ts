import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(true);
  readonly validCredentials = {
    email: 'demo@tienda.es',
    password: 'demo123',
  };

  constructor(private readonly storage: StorageService) {
    this.storage.initializeStorage();
    const token = this.storage.getAuthToken();
    this.isAuthenticated.set(!!token);
    this.isLoading.set(false);
  }

  async login(email: string, password: string): Promise<void> {
    this.isLoading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email !== this.validCredentials.email || password !== this.validCredentials.password) {
      this.isLoading.set(false);
      throw new Error('Credenciales invalidas');
    }

    this.storage.setAuthToken(`demo-token-${Date.now()}`, 8);
    this.isAuthenticated.set(true);
    this.isLoading.set(false);
  }

  logout(): void {
    this.storage.clearAuthToken();
    this.isAuthenticated.set(false);
  }
}
