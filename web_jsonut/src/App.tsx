import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const API_URL = 'http://localhost:3000/api/products';
const ITEMS_PER_PAGE = 5;

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard'); 
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk Modal Produk
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, stock: 0 });

  // State & Handler untuk Dropdown Admin
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State Login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(''); 
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogout = () => {
  if (window.confirm('Yakin ingin keluar dari Admin Panel?')) {
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    setProducts([]);
    setActiveTab('Dashboard');
    }
  };

  // 1. Fetch Data
  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) setProducts(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
    fetchProducts();
    }
  }, [isLoggedIn]);

    const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoginError('');
  setIsLoggingIn(true);

    try {
      const response = await axios.post(
        'http://localhost:3000/api/users/login',
        {
          email: loginEmail,
          password: loginPassword,
        }
      );

      if (response.data.success && response.data.data.role === 'admin') {
        setIsLoggedIn(true);
        setLoginPassword('');
      } else {
        setLoginError('Akun tidak memiliki akses admin.');
      }
    } catch (error: any) {
      setLoginError(
        error.response?.data?.message || 'Login gagal. Periksa koneksi server.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Handlers untuk Form Produk
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      alert('Gagal menyimpan data. Pastikan API Server berjalan.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Gagal menghapus data:', error);
      }
    }
  };

  const openModalForEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({ name: product.name, price: product.price, stock: product.stock });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, stock: 0 });
  };

  // 3. Handler Update Cepat untuk Tab Stok
  const handleQuickStockUpdate = async (id: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change); // Stok tidak boleh minus
    try {
      await axios.put(`${API_URL}/${id}`, { stock: newStock });
      fetchProducts();
    } catch (error) {
      console.error('Gagal update stok:', error);
    }
  };

  // 4. Logika Pencarian & Paginasi
  const processedProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, activeTab]);

  const getStatus = (stock: number) => stock <= 0 ? 'Habis' : stock < 5 ? 'Menipis' : 'Aman';

  // --- RENDER PER TAB ---

const renderDashboard = () => {
    // Menangkap semua produk yang stoknya di bawah 5 (termasuk 0 / Habis)
    const warningStockItems = products.filter(p => p.stock < 5);
    const totalPhysicalStock = products.reduce((sum, p) => sum + p.stock, 0);

    return (
      <>
        <div className="card-grid">
          <div className="card">
            <div className="card-title">Total Jenis Donat</div>
            <div className="card-value">{products.length}</div>
          </div>
          <div className="card">
            <div className="card-title">Varian Perlu Perhatian</div>
            <div className={`card-value ${warningStockItems.length > 0 ? 'danger' : ''}`}>
              {warningStockItems.length}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Total Fisik Donat</div>
            <div className="card-value">{totalPhysicalStock} pcs</div>
          </div>
        </div>

        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>⚠️ Peringatan Status Stok (Habis & Menipis)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode</th><th>Nama Donat</th><th>Sisa Stok</th><th>Kondisi</th><th>Aksi Rekomendasi</th>
            </tr>
          </thead>
          <tbody>
            {warningStockItems.length > 0 ? warningStockItems.map(p => (
              <tr key={p.id}>
                <td>DN-{p.id.toString().padStart(3, '0')}</td>
                <td>{p.name}</td>
                <td style={{ fontWeight: 'bold', color: p.stock === 0 ? '#dc2626' : '#d97706' }}>
                  {p.stock} pcs
                </td>
                <td>
                  <span className={`status-${getStatus(p.stock).toLowerCase()}`}>
                    {getStatus(p.stock)}
                  </span>
                </td>
                <td>
                  {p.stock === 0 ? 'Restock Segera!' : 'Tambah Produksi'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="empty-state">Luar biasa! Semua stok donat dalam keadaan aman.</td></tr>
            )}
          </tbody>
        </table>
      </>
    );
  };

  const renderProduk = () => (
    <>
      <div className="toolbar">
        <input type="text" placeholder="Cari nama donat..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input search-input" />
        <button onClick={() => setIsModalOpen(true)} className="btn-secondary add-btn">+ Tambah Produk</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Kode</th><th>Nama Donat</th><th>Harga</th><th>Stok</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.length > 0 ? paginatedProducts.map(product => (
            <tr key={product.id}>
              <td>DN-{product.id.toString().padStart(3, '0')}</td>
              <td>{product.name}</td>
              <td>Rp {product.price.toLocaleString('id-ID')}</td>
              <td>{product.stock}</td>
              <td>
                <span onClick={() => openModalForEdit(product)} className="action-link">Edit</span>
                <span onClick={() => handleDelete(product.id)} className="action-link delete">Delete</span>
              </td>
            </tr>
          )) : <tr><td colSpan={5} className="empty-state">Tidak ada data produk.</td></tr>}
        </tbody>
      </table>
      {renderPagination()}
    </>
  );

  const renderStok = () => (
    <>
      <div className="toolbar">
        <input type="text" placeholder="Cari donat untuk update stok..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input search-input" />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nama Donat</th><th>Kondisi</th><th>Sisa Stok</th><th>Penyesuaian Cepat</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.length > 0 ? paginatedProducts.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td className={`status-${getStatus(product.stock).toLowerCase()}`}>
                {getStatus(product.stock)}
              </td>
              <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{product.stock}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleQuickStockUpdate(product.id, product.stock, -1)} 
                    className="btn-secondary" style={{ padding: '4px 12px', borderColor: '#dc2626', color: '#dc2626' }}>
                    -1
                  </button>
                  <button 
                    onClick={() => handleQuickStockUpdate(product.id, product.stock, 1)} 
                    className="btn-secondary" style={{ padding: '4px 12px', borderColor: '#16a34a', color: '#16a34a' }}>
                    +1
                  </button>
                  <button 
                    onClick={() => handleQuickStockUpdate(product.id, product.stock, 10)} 
                    className="btn-secondary" style={{ padding: '4px 12px', backgroundColor: '#dcfce7' }}>
                    +10
                  </button>
                </div>
              </td>
            </tr>
          )) : <tr><td colSpan={4} className="empty-state">Tidak ada data stok.</td></tr>}
        </tbody>
      </table>
      {renderPagination()}
    </>
  );

  const renderPagination = () => (
    <div className="pagination">
      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="page-button">◀ Prev</button>
      <span className="page-info">Halaman {currentPage} dari {totalPages}</span>
      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="page-button">Next ▶</button>
    </div>
  );

  if (!isLoggedIn) {
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>JSONut</h1>
        <p>Login Admin Panel</p>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="Masukkan email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder="Masukkan password"
          required
        />

        {loginError && (
          <p className="login-error">{loginError}</p>
        )}

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? 'Memeriksa...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>JSONut</h2>
          <i>Admin Panel</i>
        </div>
        <div className="sidebar-menu">
          {['Dashboard', 'Produk', 'Stok'].map(tab => (
            <button 
              key={tab} 
              onClick={() => {
                setActiveTab(tab);
                setSearch(''); 
              }}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="content-header">
          <h2>Modul {activeTab}</h2>
          
          <div className="admin-profile-container">
            <span 
              className="admin-profile" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Admin ▼
            </span>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={handleLogout}>Log Out</div>
              </div>
            )}
          </div>
        </div>

        {/* PENGKONDISIAN TAB AKTIF */}
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Produk' && renderProduk()}
        {activeTab === 'Stok' && renderStok()}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingId ? 'Edit Data Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Donat</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Harga (Rp)</label>
                  <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required min="0" className="form-input" />
                </div>
                <div className="form-group half">
                  <label className="form-label">Stok</label>
                  <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} min="0" className="form-input" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;