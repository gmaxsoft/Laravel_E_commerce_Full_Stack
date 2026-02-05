import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ordersApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_test_placeholder');

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

function StripePaymentForm({ order, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
        receipt_email: order.shipping_address?.email,
      },
    });
    if (error) {
      toast.error(error.message || 'Błąd płatności');
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
      >
        {loading ? 'Przetwarzanie...' : `Zapłać ${formatPrice(order?.total || 0)}`}
      </button>
    </form>
  );
}

const PAYMENT_OPTIONS = [
  { id: 'stripe', name: 'Stripe', label: 'Karta płatnicza (Stripe)', icon: '💳' },
  { id: 'tpay', name: 'Tpay', label: 'Tpay (BLIK, karta, przelew)', icon: '🔐' },
  { id: 'bank_transfer', name: 'Przelew', label: 'Przelew na konto bankowe', icon: '🏦' },
];

export default function CheckoutPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!orderId) {
      navigate('/checkout');
      return;
    }
    ordersApi.get(orderId)
      .then((res) => setOrder(res.data.data))
      .catch(() => navigate('/checkout'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, orderId]);

  const handlePay = () => {
    if (!selectedMethod) {
      toast.error('Wybierz metodę płatności');
      return;
    }
    if (order?.payment_method) {
      toast.error('Zamówienie zostało już opłacone');
      return;
    }
    setSubmitting(true);
    ordersApi.initiatePayment(orderId, selectedMethod)
      .then((res) => {
        const data = res.data;
        setPaymentResult(data);
        setOrder(data.order?.data ?? data.order ?? order);

        if (data.payment_method === 'stripe' && data.client_secret) {
          return;
        }
        if (data.payment_method === 'tpay' && data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
        if (data.payment_method === 'bank_transfer') {
          return;
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Błąd inicjacji płatności');
      })
      .finally(() => setSubmitting(false));
  };

  if (loading || !order) {
    return <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />;
  }

  if (order.payment_method && !paymentResult) {
    if (order.payment_method === 'bank_transfer' && order.bank_details) {
      const d = order.bank_details;
      return (
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-6">Przelew bankowy</h1>
          <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg">
            <p className="text-stone-600 mb-4">
              Dokonaj przelewu na poniższe dane. W tytule wpisz numer zamówienia.
            </p>
            <div className="space-y-2 font-mono text-sm bg-stone-50 p-4 rounded-lg">
              <p><strong>Odbiorca:</strong> {d.recipient}</p>
              <p><strong>Bank:</strong> {d.bank_name}</p>
              <p><strong>Numer konta:</strong> {d.account_number}</p>
              <p><strong>Tytuł:</strong> {d.title}</p>
              <p><strong>Kwota:</strong> {formatPrice(d.amount)}</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600"
            >
              Przejdź do zamówień
            </button>
          </div>
        </div>
      );
    }
    if (order.payment_status === 'paid' || order.payment_status === 'awaiting_transfer') {
      navigate('/orders');
      return null;
    }
  }

  const bankDetails = paymentResult?.bank_details ?? order.bank_details;
  if (order.payment_method === 'bank_transfer' && bankDetails) {
    const d = bankDetails;
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-800 mb-6">Przelew bankowy</h1>
        <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg">
          <p className="text-stone-600 mb-4">
            Dokonaj przelewu na poniższe dane. W tytule wpisz numer zamówienia.
          </p>
          <div className="space-y-2 font-mono text-sm bg-stone-50 p-4 rounded-lg">
            <p><strong>Odbiorca:</strong> {d.recipient}</p>
            <p><strong>Bank:</strong> {d.bank_name}</p>
            <p><strong>Numer konta:</strong> {d.account_number}</p>
            <p><strong>Tytuł:</strong> {d.title}</p>
            <p><strong>Kwota:</strong> {formatPrice(d.amount)}</p>
          </div>
          <p className="text-sm text-stone-500 mt-4">
            Zamówienie zostanie zrealizowane po zaksięgowaniu przelewu.
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-6 bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600"
          >
            Przejdź do zamówień
          </button>
        </div>
      </div>
    );
  }

  if (paymentResult?.payment_method === 'stripe' && paymentResult?.client_secret) {
    const options = {
      clientSecret: paymentResult.client_secret,
      appearance: { theme: 'stripe' },
    };
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-800 mb-6">Płatność Stripe</h1>
        <div className="bg-white rounded-xl border border-stone-200 p-6 max-w-lg">
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentForm
              order={order}
              onSuccess={() => navigate('/orders')}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Wybierz metodę płatności</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-stone-800">Metoda płatności</h2>
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedMethod === opt.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.id}
                  checked={selectedMethod === opt.id}
                  onChange={() => setSelectedMethod(opt.id)}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
            <button
              type="button"
              onClick={handlePay}
              disabled={submitting || !selectedMethod}
              className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition mt-4"
            >
              {submitting ? 'Przekierowanie...' : 'Zamów i zapłać'}
            </button>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-semibold text-stone-800 mb-4">Podsumowanie zamówienia</h2>
            <p className="text-stone-600 text-sm mb-2">Nr {order.order_number}</p>
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm text-stone-600">
                <span className="truncate flex-1">{item.product_name} × {item.quantity}</span>
                <span className="ml-2">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-stone-200 mt-4 pt-4 flex justify-between font-bold text-stone-800">
              <span>Razem</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
