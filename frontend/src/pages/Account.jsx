import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function Account() {
  const { isAuthenticated, updateUser } = useAuth();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Polska',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    authApi.user()
      .then((res) => {
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
          city: u.city || '',
          postal_code: u.postal_code || '',
          country: u.country || 'Polska',
        });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    authApi.updateProfile({
      name: form.name,
      phone: form.phone,
      address: form.address,
      city: form.city,
      postal_code: form.postal_code,
      country: form.country,
    })
      .then((res) => {
        updateUser(res.data);
        toast.success('Dane zapisane.');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd zapisu'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <div className="h-64 bg-stone-200 rounded-xl animate-pulse" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Moje konto</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 bg-white rounded-xl border border-stone-200 p-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Imię i nazwisko</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-2 border border-stone-200 rounded-lg bg-stone-50 text-stone-500"
          />
          <p className="text-xs text-stone-500 mt-1">Email można zmienić tylko przez administratora.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Adres</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Miasto</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Kod pocztowy</label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Kraj</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg"
          />
        </div>
        <p className="text-sm text-stone-500">
          Zapisane dane będą automatycznie uzupełniane przy składaniu zamówienia.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz dane'}
        </button>
      </form>
    </div>
  );
}
