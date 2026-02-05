import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../lib/api';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock authApi
vi.mock('../../lib/api', () => ({
  authApi: {
    user: vi.fn(),
    googleRedirect: vi.fn(),
  },
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

describe('Login', () => {
  const mockLogin = vi.fn();
  const mockGoogleLogin = vi.fn();

  // Helper function to clear localStorage
  function clearLocalStorage() {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => localStorage.removeItem(key));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    clearLocalStorage();
    mockSearchParams.delete('token');
    mockSearchParams.delete('error');
    useAuth.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
    });
  });

  it('should render login form', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Logowanie')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument();
  });

  it('should update email input value', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password input value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = container.querySelector('input[type="password"]');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should call login function on form submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({});

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should navigate to home after successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({});

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display generic error message when error response has no message', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({});

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/błąd logowania/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByRole('textbox');
    const passwordInput = container.querySelector('input[type="password"]');
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Logowanie...')).toBeInTheDocument();
  });

  it('should call googleLogin when Google login button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const googleButton = screen.getByText('Zaloguj przez Google');
    await user.click(googleButton);

    expect(mockGoogleLogin).toHaveBeenCalled();
  });

  it('should render link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const registerLink = screen.getByText('Zarejestruj się');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should handle token from URL search params', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    mockSearchParams.set('token', 'test-token');
    authApi.user.mockResolvedValue({ data: mockUser });

    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(authApi.user).toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  it('should handle auth error from URL search params', async () => {
    mockSearchParams.set('error', 'auth_failed');

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/logowanie przez google nie powiodło się/i)
      ).toBeInTheDocument();
    });
  });
});
