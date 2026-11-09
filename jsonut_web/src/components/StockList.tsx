import type { Product } from '../types/data_type';

interface StockListProps {
  products: Product[];
  search: string;
  onSearch: (value: string) => void;
  onUpdateStock: (
    id: number,
    currentStock: number,
    change: number
  ) => void | Promise<void>;
  updatingStockId: number | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getStatus = (stock: number) => {
  if (stock <= 0) return 'Habis';
  if (stock < 5) return 'Menipis';
  return 'Aman';
};

export default function StockList({
  products,
  search,
  onSearch,
  onUpdateStock,
  updatingStockId,
  currentPage,
  totalPages,
  onPageChange,
}: StockListProps) {
  const isUpdating = updatingStockId !== null;

  return (
    <section className="stock-list">
      <div className="toolbar">
        <input
          type="text"
          placeholder="Cari donat untuk update stok..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="form-input search-input"
          disabled={isUpdating}
        />
      </div>

      <div className="stock-table-wrapper">
        <table className="data-table stock-table">
          <thead>
            <tr>
              <th>Nama Donat</th>
              <th>Kondisi</th>
              <th>Sisa Stok</th>
              <th>Penyesuaian Cepat</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((product) => {
                const status = getStatus(product.stock);

                return (
                  <tr key={product.id}>
                    <td className="stock-product-name">
                      {product.name}
                    </td>

                    <td>
                      <span
                        className={`status-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="stock-quantity">
                      {product.stock}
                    </td>

                    <td>
                      <div className="stock-adjustment">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(
                              product.id,
                              product.stock,
                              -1
                            )
                          }
                          disabled={product.stock <= 0 || isUpdating}
                          className="stock-adjust-button stock-adjust-minus"
                        >
                          -1
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(
                              product.id,
                              product.stock,
                              1
                            )
                          }
                          disabled={isUpdating}
                          className="stock-adjust-button stock-adjust-plus"
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStock(
                              product.id,
                              product.stock,
                              10
                            )
                          }
                          disabled={isUpdating}
                          className="stock-adjust-button stock-adjust-bulk"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="empty-state">
                  <div className="stock-empty-state">
                    <strong>Tidak ada data stok.</strong>
                    <span>
                      Coba gunakan kata kunci pencarian lain.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isUpdating}
          className="page-button"
        >
          ◀ Prev
        </button>

        <span className="page-info">
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isUpdating}
          className="page-button"
        >
          Next ▶
        </button>
      </div>
    </section>
  );
}