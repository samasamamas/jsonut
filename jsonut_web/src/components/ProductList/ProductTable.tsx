import type { Product } from '../../types/data_type';
import ProductRow from './ProductRow';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void | Promise<void>;
  deletingProductId: number | null;
}

const ProductTable = ({
  products,
  onEdit,
  onDelete,
  deletingProductId,
}: ProductTableProps) => {
  return (
    <section>
      {products.length === 0 ? (
        <p className="empty-state">
          Tidak ada data produk.
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Foto</th>
              <th>Nama Donat</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {products.map((item) => (
              <ProductRow
                key={item.id}
                product={item}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={deletingProductId === item.id}
                isAnyDeleting={deletingProductId !== null}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default ProductTable;