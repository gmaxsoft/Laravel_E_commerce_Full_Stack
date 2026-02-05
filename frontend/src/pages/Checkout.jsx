import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi, cartApi, ordersApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    shipping_name: '',
    shipping_email: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '00-000',
    shipping_country: 'Polska',
    coupon_code: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    Promise.all([cartApi.get(), authApi.user()])
      .then(([cartRes, userRes]) => {
        setCart(cartRes.data.data);
        const u = userRes.data;
        setForm((f) => ({
          ...f,
          shipping_name: u.name || f.shipping_name,
          shipping_email: u.email || f.shipping_email,
          shipping_phone: u.phone || f.shipping_phone,
          shipping_address: u.address || f.shipping_address,
          shipping_city: u.city || f.shipping_city,
          shipping_postal_code: u.postal_code || f.shipping_postal_code,
          shipping_country: u.country || f.shipping_country,
        }));
      })
      .catch(() => navigate('/cart'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!cart?.id) return;
    setLoading(true);
    const orderData = {
      cart_id: cart.id,
      coupon_code: form.coupon_code || undefined,
      ...form,
    };
    ordersApi.create(orderData)
      .then((res) => {
        const order = res.data.data;
        authApi.updateProfile({
          name: form.shipping_name,
          phone: form.shipping_phone,
          address: form.shipping_address,
          city: form.shipping_city,
          postal_code: form.shipping_postal_code,
          country: form.shipping_country,
        }).catch(() => {});
        navigate(`/checkout/payment/${order.id}`);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Błąd tworzenia zamówienia');
      })
      .finally(() => setLoading(false));
  };

  if (loading && !cart) {
    return <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />;
  }

  if (!cart || !cart.items?.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Kasa</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleCreateOrder} className="space-y-4 bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800">Dane do wysyłki</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Imię i nazwisko</label>
              <input
                type="text"
                required
                value={form.shipping_name}
                onChange={(e) => setForm((f) => ({ ...f, shipping_name: e.target.value }))}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.shipping_email}
                onChange={(e) => setForm((f) => ({ ...f, shipping_email: e.target.value }))}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={form.shipping_phone}
              onChange={(e) => setForm((f) => ({ ...f, shipping_phone: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Adres</label>
            <input
              type="text"
              required
              value={form.shipping_address}
              onChange={(e) => setForm((f) => ({ ...f, shipping_address: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Miasto</label>
              <input
                type="text"
                required
                value={form.shipping_city}
                onChange={(e) => setForm((f) => ({ ...f, shipping_city: e.target.value }))}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Kod pocztowy</label>
              <input
                type="text"
                required
                value={form.shipping_postal_code}
                onChange={(e) => setForm((f) => ({ ...f, shipping_postal_code: e.target.value }))}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Kraj</label>
            <input
              type="text"
              required
              value={form.shipping_country}
              onChange={(e) => setForm((f) => ({ ...f, shipping_country: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Kod rabatowy</label>
            <input
              type="text"
              value={form.coupon_code}
              onChange={(e) => setForm((f) => ({ ...f, coupon_code: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
          >
            {loading ? 'Tworzenie zamówienia...' : 'Przejdź do płatności'}
          </button>
        </form>
        <div>
          <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-semibold text-stone-800 mb-4">Podsumowanie</h2>
            {cart.items?.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm text-stone-600">
                <span className="truncate flex-1">{item.product?.name} × {item.quantity}</span>
                <span className="ml-2">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-stone-200 mt-4 pt-4 flex justify-between font-bold text-stone-800">
              <span>Razem</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
