import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with logo and navigation links', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    expect(screen.getByText('Odzież Używana')).toBeInTheDocument();
    expect(screen.getByText('Produkty')).toBeInTheDocument();
    expect(screen.getByText('Koszyk')).toBeInTheDocument();
  });

  it('should show login and register links when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    expect(screen.getByText('Zaloguj')).toBeInTheDocument();
    expect(screen.getByText('Rejestracja')).toBeInTheDocument();
    expect(screen.queryByText('Zamówienia')).not.toBeInTheDocument();
    expect(screen.queryByText('Wyloguj')).not.toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Zamówienia')).toBeInTheDocument();
    expect(screen.getByText('Wyloguj')).toBeInTheDocument();
    expect(screen.queryByText('Zaloguj')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejestracja')).not.toBeInTheDocument();
  });

  it('should call logout and navigate when logout button is clicked', () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Wyloguj');
    logoutButton.click();

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render footer with current year', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it('should render Outlet for nested routes', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Outlet renders children, so we check that main content area exists
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
