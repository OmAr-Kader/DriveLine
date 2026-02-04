/**
 * Secure localStorage wrapper for authentication
 *
 * Safe: falls back to an in-memory store when localStorage is unavailable.
 */

const KEYS = {
  TOKEN: 'admin_token',
  SIGN_KEY: 'admin_sign_key',
  USER: 'admin_user',
  SELECTED_ROUTE: 'selected_route',
} as const;

type StoreValue = string | null;

class SafeStorage {
  private static inMemory: Record<string, string> = {};
  private static localAvailable: boolean | null = null;

  private static detectLocalStorage(): boolean {
    if (this.localAvailable !== null) return this.localAvailable;
    try {
      if (typeof window === 'undefined' || !('localStorage' in window)) {
        this.localAvailable = false;
        return false;
      }
      const testKey = '__safe_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      this.localAvailable = true;
      return true;
    } catch {
      this.localAvailable = false;
      return false;
    }
  }

  static getItem(key: string): StoreValue {
    if (this.detectLocalStorage()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // fallthrough to in-memory
      }
    }
    return Object.prototype.hasOwnProperty.call(this.inMemory, key)
      ? this.inMemory[key]
      : null;
  }

  static setItem(key: string, value: string): void {
    if (this.detectLocalStorage()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // fallthrough to in-memory
      }
    }
    this.inMemory[key] = value;
  }

  static removeItem(key: string): void {
    if (this.detectLocalStorage()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // fallthrough to in-memory
      }
    }
    delete this.inMemory[key];
  }
}

export class AuthStorage {
  static getToken(): string | null {
    return SafeStorage.getItem(KEYS.TOKEN);
  }

  static setToken(token: string): void {
    SafeStorage.setItem(KEYS.TOKEN, token);
  }

  static getSignKey(): string | null {
    return SafeStorage.getItem(KEYS.SIGN_KEY);
  }

  static setSignKey(signKey: string): void {
    SafeStorage.setItem(KEYS.SIGN_KEY, signKey);
  }

  static getUser<T>(): T | null {
    const user = SafeStorage.getItem(KEYS.USER);
    if (!user) return null;
    try {
      return JSON.parse(user) as T;
    } catch {
      // corrupted data -> remove and return null
      SafeStorage.removeItem(KEYS.USER);
      return null;
    }
  }

  static setUser(user: unknown): void {
    try {
      SafeStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch {
      // fallback: store a simple string if JSON fails
      SafeStorage.setItem(KEYS.USER, String(user));
    }
  }

  static clear(): void {
    SafeStorage.removeItem(KEYS.TOKEN);
    SafeStorage.removeItem(KEYS.SIGN_KEY);
    SafeStorage.removeItem(KEYS.USER);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export class NavigationStorage {
  static getSelectedRoute(): string | null {
    return SafeStorage.getItem(KEYS.SELECTED_ROUTE);
  }

  static setSelectedRoute(path: string): void {
    SafeStorage.setItem(KEYS.SELECTED_ROUTE, path);
  }

  static clearSelectedRoute(): void {
    SafeStorage.removeItem(KEYS.SELECTED_ROUTE);
  }
} 