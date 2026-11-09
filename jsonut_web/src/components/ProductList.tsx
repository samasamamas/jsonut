import type { Product } from '../types/data_type';
import ProductTable from './ProductList/ProductTable';

interface ProductListProps {
  products: Product[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void | Promise<void>;
  deletingProductId: number | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductList = ({
  products,
  search,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  deletingProductId,
  currentPage,
  totalPages,
  onPageChange,
}: ProductListProps) => {
  return (
    <section className="product-list">
      <div className="toolbar">
        <input
          type="text"
          placeholder="Cari nama donat..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="form-input search-input"
        />

        <button
          onClick={onAdd}
          className="btn-secondary add-btn"
        >
          + Tambah Produk
        </button>
      </div>

      <ProductTable
        products={products}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingProductId={deletingProductId}
      />

      <div className="pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="page-button"
        >
          ◀ Prev
        </button>

        <span className="page-info">
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="page-button"
        >
          Next ▶
        </button>
      </div>
    </section>
  );
};

export default ProductList;