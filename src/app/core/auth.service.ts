import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(true);

  constructor(private readonly storage: StorageService) {
    this.storage.initializeStorage();
    this.isAuthenticated.set(!!this.storage.getAuthToken());
    this.isLoading.set(false);
  }

  async login(email: string, password: string): Promise<void> {
    this.isLoading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email !== 'demo@tienda.es' || password !== 'demo123') {
      this.isLoading.set(false);
      throw new Error('Credenciales invalidas');
    }

    this.storage.setAuthToken(`demo-token-${Date.now()}`);
    this.isAuthenticated.set(true);
    this.isLoading.set(false);
  }

  logout(): void {
    this.storage.clearAuthToken();
    this.isAuthenticated.set(false);
  }
}
