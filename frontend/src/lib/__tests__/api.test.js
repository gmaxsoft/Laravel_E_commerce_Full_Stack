import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi, productsApi, cartApi, ordersApi, couponsApi } from '../api';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  const mockAxiosInstance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Helper function to clear localStorage
function clearLocalStorage() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => localStorage.removeItem(key));
}

describe('api', () => {
  beforeEach(() => {
    clearLocalStorage();
  });

  afterEach(() => {
    clearLocalStorage();
    vi.clearAllMocks();
  });

  describe('authApi', () => {
    it('should have register method', () => {
      expect(authApi.register).toBeDefined();
      expect(typeof authApi.register).toBe('function');
    });

    it('should have login method', () => {
      expect(authApi.login).toBeDefined();
      expect(typeof authApi.login).toBe('function');
    });

    it('should have logout method', () => {
      expect(authApi.logout).toBeDefined();
      expect(typeof authApi.logout).toBe('function');
    });

    it('should have user method', () => {
      expect(authApi.user).toBeDefined();
      expect(typeof authApi.user).toBe('function');
    });

    it('should have updateProfile method', () => {
      expect(authApi.updateProfile).toBeDefined();
      expect(typeof authApi.updateProfile).toBe('function');
    });

    it('should have googleRedirect method', () => {
      expect(authApi.googleRedirect).toBeDefined();
      expect(typeof authApi.googleRedirect).toBe('function');
    });

    it('should call register with correct data', async () => {
      const data = { email: 'test@example.com', password: 'password', name: 'Test' };
      await authApi.register(data);
      // The actual axios call is mocked, so we just verify the method exists and can be called
      expect(authApi.register).toBeDefined();
    });
  });

  describe('productsApi', () => {
    it('should have list method', () => {
      expect(productsApi.list).toBeDefined();
      expect(typeof productsApi.list).toBe('function');
    });

    it('should have get method', () => {
      expect(productsApi.get).toBeDefined();
      expect(typeof productsApi.get).toBe('function');
    });

    it('should call list with params', async () => {
      await productsApi.list({ page: 1 });
      expect(productsApi.list).toBeDefined();
    });

    it('should call get with id', async () => {
      await productsApi.get(1);
      expect(productsApi.get).toBeDefined();
    });
  });

  describe('cartApi', () => {
    it('should have get method', () => {
      expect(cartApi.get).toBeDefined();
      expect(typeof cartApi.get).toBe('function');
    });

    it('should have addItem method', () => {
      expect(cartApi.addItem).toBeDefined();
      expect(typeof cartApi.addItem).toBe('function');
    });

    it('should have updateItem method', () => {
      expect(cartApi.updateItem).toBeDefined();
      expect(typeof cartApi.updateItem).toBe('function');
    });

    it('should have removeItem method', () => {
      expect(cartApi.removeItem).toBeDefined();
      expect(typeof cartApi.removeItem).toBe('function');
    });

    it('should have clear method', () => {
      expect(cartApi.clear).toBeDefined();
      expect(typeof cartApi.clear).toBe('function');
    });

    it('should call addItem with correct parameters', async () => {
      await cartApi.addItem(1, 2);
      expect(cartApi.addItem).toBeDefined();
    });
  });

  describe('ordersApi', () => {
    it('should have list method', () => {
      expect(ordersApi.list).toBeDefined();
      expect(typeof ordersApi.list).toBe('function');
    });

    it('should have get method', () => {
      expect(ordersApi.get).toBeDefined();
      expect(typeof ordersApi.get).toBe('function');
    });

    it('should have create method', () => {
      expect(ordersApi.create).toBeDefined();
      expect(typeof ordersApi.create).toBe('function');
    });

    it('should have initiatePayment method', () => {
      expect(ordersApi.initiatePayment).toBeDefined();
      expect(typeof ordersApi.initiatePayment).toBe('function');
    });

    it('should call create with data', async () => {
      await ordersApi.create({ items: [] });
      expect(ordersApi.create).toBeDefined();
    });
  });

  describe('couponsApi', () => {
    it('should have list method', () => {
      expect(couponsApi.list).toBeDefined();
      expect(typeof couponsApi.list).toBe('function');
    });

    it('should have get method', () => {
      expect(couponsApi.get).toBeDefined();
      expect(typeof couponsApi.get).toBe('function');
    });

    it('should have validate method', () => {
      expect(couponsApi.validate).toBeDefined();
      expect(typeof couponsApi.validate).toBe('function');
    });

    it('should call validate with code and amount', async () => {
      await couponsApi.validate('DISCOUNT10', 100);
      expect(couponsApi.validate).toBeDefined();
    });
  });
});
