import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

const STATUS_LABELS = {
  pending: 'Oczekuje',
  processing: 'W realizacji',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    ordersApi.get(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, navigate]);

  if (loading || !order) {
    return (
      <div>
        {loading ? (
          <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />
        ) : (
          <div className="text-center py-16">Zamówienie nie znalezione.</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          Zamówienie {order.order_number}
        </h1>
        <Link to="/orders" className="text-primary-600 hover:underline text-sm">
          ← Powrót do zamówień
        </Link>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Status</h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Adres dostawy</h2>
            <p className="text-stone-600">
              {order.shipping_address?.name && <>{order.shipping_address.name}<br /></>}
              {order.shipping_address?.address && <>{order.shipping_address.address}<br /></>}
              {order.shipping_address?.postal_code} {order.shipping_address?.city}<br />
              {order.shipping_address?.country}<br />
              {order.shipping_address?.email}
            </p>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Produkty</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-stone-500 text-sm ml-2">× {item.quantity}</span>
                  </div>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-200 space-y-1 text-sm text-stone-600">
              <div className="flex justify-between">
                <span>Suma netto</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Podatek</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Rabat</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between font-bold text-lg">
              <span>Razem</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
