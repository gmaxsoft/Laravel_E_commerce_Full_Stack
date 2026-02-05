import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi, cartApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function formatPrice(price) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
}

function ProductCard({ product, onAddToCart }) {
  const img = product.images?.[0] || '/placeholder-product.jpg';
  const [adding, setAdding] = useState(false);

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || product.available_stock <= 0) return;
    onAddToCart(product, setAdding);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="block bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition group"
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        <img
          src={typeof img === 'string' ? img : img?.url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => { e.target.src = 'https://placehold.co/400x400/f5f5f4/78716c?text=Brak+zdjęcia'; }}
        />
        {product.sale_price && (
          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
            Promocja
          </span>
        )}
        {product.available_stock <= 0 && (
          <span className="absolute inset-0 bg-stone-900/50 flex items-center justify-center text-white font-medium">
            Wyprzedane
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-800 truncate">{product.name}</h3>
        <p className="text-sm text-stone-500 mt-0.5">
          {product.category} {product.brand && `• ${product.brand}`}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">{formatPrice(product.current_price)}</span>
          {product.sale_price && product.price !== product.sale_price && (
            <span className="text-sm text-stone-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <button
          onClick={handleAddClick}
          disabled={product.available_stock <= 0 || adding}
          className="mt-3 w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {adding ? 'Dodawanie...' : 'Dodaj do koszyka'}
        </button>
      </div>
    </Link>
  );
}

export default function Products() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState({ data: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    productsApi.list({ ...filters, page })
      .then((res) => { if (!cancelled) setProducts(res.data); })
      .catch(() => { if (!cancelled) setProducts({ data: [] }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters destructured to avoid refetch on object identity change
  }, [filters.category, filters.search, filters.sort_by, filters.sort_order, page]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const handleAddToCart = (product, setAdding) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    cartApi.addItem(product.id, 1)
      .then(() => navigate('/cart'))
      .catch((err) => toast.error(err.response?.data?.message || 'Błąd dodawania do koszyka'))
      .finally(() => setAdding(false));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Produkty</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Szukaj produktów..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Wszystkie kategorie</option>
          <option value="odziez">Odzież</option>
          <option value="obutrze">Obuwie</option>
          <option value="akcesoria">Akcesoria</option>
        </select>
        <select
          value={`${filters.sort_by}_${filters.sort_order}`}
          onChange={(e) => {
            const parts = e.target.value.split('_');
            const sort_order = parts.pop();
            const sort_by = parts.join('_');
            handleFilterChange('sort_by', sort_by);
            handleFilterChange('sort_order', sort_order);
          }}
          className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="created_at_desc">Najnowsze</option>
          <option value="price_asc">Cena: rosnąco</option>
          <option value="price_desc">Cena: malejąco</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-stone-200 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      ) : products.data?.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          Brak produktów do wyświetlenia.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.data?.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {products.meta?.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-stone-300 hover:bg-primary-50 disabled:opacity-50"
          >
            Poprzednia
          </button>
          <span className="px-4 py-2 text-stone-600">
            {page} / {products.meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(products.meta.last_page, p + 1))}
            disabled={page >= products.meta.last_page}
            className="px-3 py-1 rounded border border-stone-300 hover:bg-primary-50 disabled:opacity-50"
          >
            Następna
          </button>
        </div>
      )}
    </div>
  );
}
