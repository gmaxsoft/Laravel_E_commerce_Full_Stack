import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import { authApi } from '../../lib/api';

// Mock api
vi.mock('../../lib/api', () => ({
  authApi: {
    user: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    googleRedirect: vi.fn(),
  },
}));

// Test component that uses AuthContext
function TestComponent() {
  const { user, token, loading, isAuthenticated, login, register, logout, updateUser } =
    React.useContext(AuthContext);

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button
        data-testid="login-btn"
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button
        data-testid="register-btn"
        onClick={() => register({ email: 'test@example.com', password: 'password', name: 'Test' })}
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button
        data-testid="update-user-btn"
        onClick={() => updateUser({ id: 1, name: 'Updated Name', email: 'test@example.com' })}
      >
        Update User
      </button>
    </div>
  );
}

// Helper function to clear localStorage
function clearLocalStorage() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => localStorage.removeItem(key));
}

describe('AuthContext', () => {
  beforeEach(() => {
    clearLocalStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearLocalStorage();
  });

  it('should initialize with null user and token when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  it('should initialize with user and token from localStorage', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'test-token';

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
  });

  it('should fetch user when token exists but user does not', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'test-token';

    localStorage.setItem('token', mockToken);
    authApi.user.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authApi.user).toHaveBeenCalled();
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('should clear user and token when user fetch fails', async () => {
    const mockToken = 'invalid-token';
    localStorage.setItem('token', mockToken);
    authApi.user.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  it('should login user and save to localStorage', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'new-token';

    authApi.login.mockResolvedValue({
      data: { user: mockUser, token: mockToken },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const loginButton = screen.getByTestId('login-btn');
    loginButton.click();

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  it('should register user and save to localStorage', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@example.com' };
    const mockToken = 'new-token';

    authApi.register.mockResolvedValue({
      data: { user: mockUser, token: mockToken },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const registerButton = screen.getByTestId('register-btn');
    registerButton.click();

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  it('should logout user and clear localStorage', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'test-token';

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    authApi.logout.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const logoutButton = screen.getByTestId('logout-btn');
    logoutButton.click();

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  it('should logout even if API call fails', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'test-token';

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    authApi.logout.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const logoutButton = screen.getByTestId('logout-btn');
    logoutButton.click();

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  it('should update user and localStorage', async () => {
    const initialUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const updatedUser = { id: 1, name: 'Updated Name', email: 'test@example.com' };

    localStorage.setItem('user', JSON.stringify(initialUser));
    localStorage.setItem('token', 'test-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const updateButton = screen.getByTestId('update-user-btn');
    updateButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(updatedUser));
      expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser));
    });
  });
});
