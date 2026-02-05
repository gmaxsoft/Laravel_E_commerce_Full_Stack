import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    cartApi.get()
      .then((res) => setCart(res.data.data))
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const fixOutOfStockItems = () => {
    const promises = outOfStockItems.map((item) => {
      const available = item.product?.available_stock ?? 0;
      if (available === 0) return cartApi.removeItem(item.id);
      return cartApi.updateItem(item.id, available);
    });
    Promise.all(promises)
      .then(() => cartApi.get())
      .then((res) => setCart(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd'));
  };

  const updateQuantity = (itemId, quantity) => {
    cartApi.updateItem(itemId, quantity)
      .then((res) => setCart(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd aktualizacji'));
  };

  const removeItem = (itemId) => {
    cartApi.removeItem(itemId)
      .then((res) => setCart(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd usuwania'));
  };

  const clearCart = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = () => {
    setShowClearConfirm(false);
    cartApi.clear()
      .then(() => {
        setCart(null);
        navigate('/');
        toast.success('Koszyk został wyczyszczony');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd'));
  };

  if (loading) {
    return <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />;
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-600 mb-4">Twój koszyk jest pusty.</p>
        <Link to="/" className="text-primary-600 hover:underline">
          Przeglądaj produkty
        </Link>
      </div>
    );
  }

  const outOfStockItems = cart.items.filter(
    (item) => (item.product?.available_stock ?? 0) < item.quantity
  );
  const hasOutOfStock = outOfStockItems.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Koszyk</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {hasOutOfStock && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-4 flex flex-wrap items-center justify-between gap-2">
              <span>Niektóre produkty są niedostępne. Usuń je lub zmniejsz ilość.</span>
              <button
                type="button"
                onClick={fixOutOfStockItems}
                className="text-amber-800 underline font-medium hover:no-underline"
              >
                Dostosuj automatycznie
              </button>
            </div>
          )}
          {cart.items.map((item) => {
            const available = item.product?.available_stock ?? 0;
            const isOutOfStock = available < item.quantity;
            const maxQty = Math.max(0, Math.min(available, 20));
            return (
            <div
              key={item.id}
              className={`flex gap-4 bg-white rounded-xl border p-4 ${isOutOfStock ? 'border-amber-300 bg-amber-50/50' : 'border-stone-200'}`}
            >
              <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product?.images?.[0] || 'https://placehold.co/100/f5f5f4/78716c'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.product_id}`}
                  className="font-medium text-stone-800 hover:text-primary-600 truncate block"
                >
                  {item.product?.name}
                </Link>
                <p className="text-sm text-stone-500">{formatPrice(item.price)} / szt.</p>
                {available <= 0 && (
                  <p className="text-sm text-red-600 font-medium mt-1">Produkt niedostępny</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {maxQty > 0 ? (
                  <select
                    value={item.quantity > maxQty ? maxQty : item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    className={`px-2 py-1 border rounded text-sm ${isOutOfStock ? 'border-amber-500' : 'border-stone-300'}`}
                  >
                    {[...Array(maxQty)].map((_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-red-600">Usuń</span>
                )}
                <span className="font-semibold w-20 text-right">
                  {formatPrice(item.subtotal)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Usuń"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
          })}
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Wyczyść koszyk
          </button>
          {showClearConfirm && (
            <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClearConfirm(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <p className="text-stone-800 font-medium mb-4">Czy na pewno chcesz wyczyścić koszyk?</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition">
                    Anuluj
                  </button>
                  <button onClick={confirmClearCart} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition">
                    Wyczyść
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-semibold text-stone-800 mb-4">Podsumowanie</h2>
            <div className="space-y-2 text-stone-600">
              <div className="flex justify-between">
                <span>Produkty ({cart.total_items})</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
            <div className="border-t border-stone-200 mt-4 pt-4 flex justify-between font-bold text-stone-800">
              <span>Razem</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <Link
              to={hasOutOfStock ? '#' : '/checkout'}
              className={`mt-4 block w-full text-center py-3 rounded-lg transition ${
                hasOutOfStock
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
              onClick={(e) => hasOutOfStock && e.preventDefault()}
            >
              {hasOutOfStock ? 'Usuń niedostępne produkty' : 'Przejdź do kasy'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
