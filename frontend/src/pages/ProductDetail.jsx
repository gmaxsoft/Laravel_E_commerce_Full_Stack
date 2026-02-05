import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi, cartApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

const CONDITION_LABELS = {
  excellent: 'Świetny',
  good: 'Dobry',
  fair: 'Akceptowalny',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    productsApi.get(id)
      .then((res) => setProduct(res.data.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    cartApi.addItem(product.id, quantity)
      .then(() => navigate('/cart'))
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd dodawania do koszyka'))
      .finally(() => setAdding(false));
  };

  if (loading || !product) {
    return (
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="h-96 bg-stone-200 rounded-xl animate-pulse" />
        ) : (
          <div className="text-center py-16">Produkt nie został znaleziony.</div>
        )}
      </div>
    );
  }

  const img = product.images?.[0] || 'https://placehold.co/600x600/f5f5f4/78716c?text=Brak+zdjęcia';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden">
          <img
            src={typeof img === 'string' ? img : img?.url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://placehold.co/600x600/f5f5f4/78716c?text=Brak+zdjęcia'; }}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{product.name}</h1>
          <p className="text-stone-500 mt-1">
            {product.category} {product.brand && `• ${product.brand}`}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(product.current_price)}
            </span>
            {product.sale_price && product.price !== product.sale_price && (
              <span className="text-lg text-stone-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-4 text-stone-600">{product.description}</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {product.size && (
              <>
                <dt className="text-stone-500">Rozmiar</dt>
                <dd>{product.size}</dd>
              </>
            )}
            {product.condition && (
              <>
                <dt className="text-stone-500">Stan</dt>
                <dd>{CONDITION_LABELS[product.condition] || product.condition}</dd>
              </>
            )}
            {product.color && (
              <>
                <dt className="text-stone-500">Kolor</dt>
                <dd>{product.color}</dd>
              </>
            )}
          </dl>
          <p className="mt-2 text-sm text-stone-500">
            Dostępnych: {product.available_stock} szt.
          </p>
          {product.available_stock > 0 ? (
            <div className="mt-6 flex gap-4">
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="px-4 py-2 border border-stone-300 rounded-lg"
              >
                {[...Array(Math.min(product.available_stock, 10))].map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 bg-primary-500 text-white py-2 px-6 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
              >
                {adding ? 'Dodawanie...' : 'Dodaj do koszyka'}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-stone-500 font-medium">Produkt niedostępny</p>
          )}
        </div>
      </div>
    </div>
  );
}
