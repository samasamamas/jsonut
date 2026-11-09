
import type { Product } from '../types/data_type';

interface DashboardProps {
  products: Product[];
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

const getImageUrl = (image: string | null | undefined) => {
  if (!image) return '';

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
};

const getStatus = (stock: number) => {
  if (stock <= 0) return 'Habis';
  if (stock < 5) return 'Menipis';
  return 'Aman';
};

export default function Dashboard({ products }: DashboardProps) {
  const validProducts = Array.isArray(products) ? products : [];

  const warningStockItems = validProducts.filter(
    (product) => Number.isFinite(product.stock) && product.stock < 5
  );

  const totalPhysicalStock = validProducts.reduce(
    (total, product) =>
      total +
      (Number.isFinite(product.stock) && product.stock > 0
        ? product.stock
        : 0),
    0
  );

  return (
    <>
      <div className="card-grid">
        <div className="card">
          <div className="card-title">Total Jenis Donat</div>
          <div className="card-value">{validProducts.length}</div>
        </div>

        <div className="card">
          <div className="card-title">Varian Perlu Perhatian</div>
          <div
            className={`card-value ${
              warningStockItems.length > 0 ? 'danger' : ''
            }`}
          >
            {warningStockItems.length}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Total Fisik Donat</div>
          <div className="card-value">{totalPhysicalStock} pcs</div>
        </div>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>
        ⚠️ Peringatan Status Stok (Habis & Menipis)
      </h3>

      <table className="data-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Foto</th>
            <th>Nama Donat</th>
            <th>Sisa Stok</th>
            <th>Kondisi</th>
            <th>Aksi Rekomendasi</th>
          </tr>
        </thead>

        <tbody>
          {warningStockItems.length > 0 ? (
            warningStockItems.map((product) => {
              const image = getImageUrl(product.image);
              const status = getStatus(product.stock);

              return (
                <tr key={product.id}>
                  <td>
                    DN-{product.id.toString().padStart(3, '0')}
                  </td>

                  <td>
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="product-thumbnail"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="product-thumbnail-placeholder">
                        No Image
                      </div>
                    )}
                  </td>

                  <td>{product.name}</td>

                  <td
                    style={{
                      fontWeight: 'bold',
                      color:
                        product.stock <= 0 ? '#dc2626' : '#d97706',
                    }}
                  >
                    {product.stock} pcs
                  </td>

                  <td>
                    <span className={`status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>

                  <td>
                    {product.stock <= 0
                      ? 'Restock Segera!'
                      : 'Tambah Produksi'}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="empty-state">
                {validProducts.length === 0
                  ? 'Belum ada data produk.'
                  : 'Luar biasa! Semua stok donat dalam keadaan aman.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
