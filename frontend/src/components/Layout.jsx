import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 transition">
              Odzież Używana
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-stone-600 hover:text-primary-600 transition">
                Produkty
              </Link>
              <Link to="/cart" className="text-stone-600 hover:text-primary-600 transition">
                Koszyk
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="text-stone-600 hover:text-primary-600 transition">
                    Zamówienia
                  </Link>
                  <Link to="/account" className="text-stone-600 hover:text-primary-600 transition text-sm font-medium">
                    {user?.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-stone-600 hover:text-red-600 transition text-sm"
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-stone-600 hover:text-primary-600 transition">
                    Zaloguj
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
                  >
                    Rejestracja
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 mt-auto py-6 text-center text-stone-500 text-sm">
        © {new Date().getFullYear()} Odzież Używana – sklep z odzieżą second-hand
      </footer>
    </div>
  );
}
