import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState({ data: [], meta: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    ordersApi.list()
      .then((res) => setOrders(res.data))
      .catch(() => setOrders({ data: [] }))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />;
  }

  if (!orders.data?.length) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-600 mb-4">Brak zamówień.</p>
        <Link to="/" className="text-primary-600 hover:underline">
          Przeglądaj produkty
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Moje zamówienia</h1>
      <div className="space-y-4">
        {orders.data.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block bg-white rounded-xl border border-stone-200 p-6 hover:border-primary-200 transition"
          >
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <span className="font-semibold text-stone-800">{order.order_number}</span>
                <span className="ml-2 text-sm text-stone-500">
                  {new Date(order.created_at).toLocaleDateString('pl-PL')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 rounded text-sm bg-stone-100 text-stone-700">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                <span className="font-bold text-primary-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-stone-500">
              {order.items?.length} produktów
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
