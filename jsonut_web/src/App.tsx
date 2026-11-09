
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import './App.css';

import type {
  Product,
  ProductFormData,
  ActiveTab,
} from './types/data_type';

import axiosClient from './api/axiosClient';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import StockList from './components/StockList';
import TransactionList from './components/TransactionList';

const ITEMS_PER_PAGE = 5;

// Mengambil pesan error dari respons server
const getErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  return (
    responseData?.message ||
    responseData?.error ||
    error?.message ||
    'Terjadi kesalahan yang tidak diketahui.'
  );
};

// HALAMAN LOGIN
function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await login(email, password);
      navigate('/home', { replace: true });
    } catch (error: any) {
      setLoginError(
        error.response?.data?.message ||
          error.message ||
          'Login gagal. Periksa koneksi server.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      isLoggingIn={isLoggingIn}
      error={loginError}
    />
  );
}

// HALAMAN ADMIN
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Menentukan tab berdasarkan URL
  const activeTab: ActiveTab =
    location.pathname === '/produk'
      ? 'Produk'
      : location.pathname === '/stok'
        ? 'Stok'
        : location.pathname === '/transaksi'
          ? 'Transaksi'
          : 'Dashboard';

  // Data produk
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pencarian dan pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal produk
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Status proses hapus dan update stok
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  // Modal konfirmasi dan error hapus
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Dropdown admin
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mengambil data produk
  const getProductsData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await axiosClient.get<{
        success: boolean;
        data: Product[];
      }>('/api/products');

      if (res.data.success && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      } else {
        throw new Error('Format data produk dari server tidak valid.');
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  // Tambah atau edit produk
  const handleSubmitProduct = async (
    data: ProductFormData,
    imageFile: File | null
  ) => {
    setIsSavingProduct(true);

    try {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('price', String(data.price));
      formData.append('stock', String(data.stock));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingProduct) {
        await axiosClient.put(
          `/api/products/${editingProduct.id}`,
          formData
        );
      } else {
        await axiosClient.post('/api/products', formData);
      }

      closeModal();
      await getProductsData();
    } catch (error: any) {
      console.error('Gagal menyimpan produk:', error);
      alert(getErrorMessage(error));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Membuka modal konfirmasi hapus
  const handleDelete = (id: number) => {
    if (deletingProductId !== null) return;

    const selectedProduct = products.find(
      (product) => product.id === id
    );

    if (!selectedProduct) return;

    setDeleteError(null);
    setProductToDelete(selectedProduct);
  };

  // Menjalankan penghapusan setelah dikonfirmasi
  const confirmDelete = async () => {
    if (!productToDelete || deletingProductId !== null) return;

    const productId = productToDelete.id;

    setDeletingProductId(productId);
    setProductToDelete(null);
    setDeleteError(null);

    try {
      await axiosClient.delete(`/api/products/${productId}`);
      await getProductsData();
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeletingProductId(null);
    }
  };

  // Menutup modal konfirmasi hapus
  const closeDeleteError = () => {
    setDeleteError(null);
  };

  // Modal tambah produk
  const openModalForAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Modal edit produk
  const openModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Menutup modal produk
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Update stok cepat
  const handleQuickStockUpdate = async (
    id: number,
    currentStock: number,
    change: number
  ) => {
    if (updatingStockId !== null) return;

    const newStock = Math.max(0, currentStock + change);

    setUpdatingStockId(id);

    try {
      await axiosClient.put(`/api/products/${id}`, {
        stock: newStock,
      });

      await getProductsData();
    } catch (error) {
      console.error('Gagal memperbarui stok:', error);
      alert(getErrorMessage(error));
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Pencarian produk
  const processedProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination produk
  const totalPages =
    Math.ceil(processedProducts.length / ITEMS_PER_PAGE) || 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedProducts = processedProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset halaman ketika URL berubah
  useEffect(() => {
    setCurrentPage(1);
    setSearch('');
  }, [location.pathname]);

  // Navigasi tab melalui URL
  const handleChangeTab = (tab: ActiveTab) => {
    const routes: Record<ActiveTab, string> = {
      Dashboard: '/home',
      Produk: '/produk',
      Stok: '/stok',
      Transaksi: '/transaksi',
    };

    navigate(routes[tab]);
  };

  // Logout
  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari Admin Panel?')) {
      logout();
      setIsDropdownOpen(false);
      setProducts([]);
      setSearch('');
      setCurrentPage(1);
      setErrorMsg(null);
      navigate('/login', { replace: true });
    }
  };

  // Tampilan loading
  if (isLoading) {
    return <div className="spinner">Memuat data produk...</div>;
  }

  // Tampilan error
  if (errorMsg) {
    return (
      <div className="error-alert">
        <p>{errorMsg}</p>
        <button type="button" onClick={getProductsData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />

      <div className="main-content">
        <div className="content-header">
          <h2>{activeTab}</h2>

          <div className="admin-profile-container">
            <span
              className="admin-profile"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Admin ▼
            </span>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Log Out
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'Dashboard' && (
          <Dashboard products={products} />
        )}

        {activeTab === 'Produk' && (
          <ProductList
            products={paginatedProducts}
            search={search}
            onSearch={setSearch}
            onAdd={openModalForAdd}
            onEdit={openModalForEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            deletingProductId={deletingProductId}
          />
        )}

        {activeTab === 'Stok' && (
          <StockList
            products={paginatedProducts}
            search={search}
            onSearch={setSearch}
            onUpdateStock={handleQuickStockUpdate}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            updatingStockId={updatingStockId}
          />
        )}

        {activeTab === 'Transaksi' && (
          <TransactionList />
        )}
      </div>

      {/* Modal tambah/edit produk */}
      {isModalOpen && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmitProduct}
          onClose={closeModal}
          isSubmitting={isSavingProduct}
        />
      )}

      {/* Modal konfirmasi hapus */}
      {productToDelete && (
        <div
          className="delete-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setProductToDelete(null);
            }
          }}
        >
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="delete-modal-icon">!</div>

            <h3 id="delete-modal-title">Hapus Produk?</h3>

            <p>
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong>{productToDelete.name}</strong>?
            </p>

            <p className="delete-modal-warning">
              Produk yang dihapus tidak dapat dikembalikan.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={() => setProductToDelete(null)}
              >
                Batal
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gagal menghapus */}
      {deleteError && (
        <div className="delete-modal-overlay">
          <div
            className="delete-modal delete-error-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-error-title"
          >
            <div className="delete-modal-icon delete-error-icon">
              ✕
            </div>

            <h3 id="delete-error-title">Gagal Menghapus</h3>

            <p>
              Produk tidak dapat dihapus.
            </p>

            <div className="delete-error-message">
              <strong>Pesan error:</strong>
              <span>{deleteError}</span>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-confirm"
                onClick={closeDeleteError}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// KONFIGURASI ROUTING
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Halaman publik */}
          <Route path="/login" element={<LoginPage />} />

          {/* Halaman yang memerlukan login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<AdminLayout />} />
            <Route path="/dashboard" element={<AdminLayout />} />
            <Route path="/produk" element={<AdminLayout />} />
            <Route path="/stok" element={<AdminLayout />} />
            <Route path="/transaksi" element={<AdminLayout />} />
          </Route>

          {/* Halaman awal */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* URL yang tidak terdaftar */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
