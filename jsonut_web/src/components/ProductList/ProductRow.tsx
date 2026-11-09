import type { Product } from '../../types/data_type';

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void | Promise<void>;
  isDeleting: boolean;
  isAnyDeleting: boolean;
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

const ProductRow = ({
  product,
  onEdit,
  onDelete,
  isDeleting,
  isAnyDeleting,
}: ProductRowProps) => {
  const image = getImageUrl(product.image);

  return (
    <tr>
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

      <td>
        Rp {product.price.toLocaleString('id-ID')}
      </td>

      <td>{product.stock} pcs</td>

      <td>
        <button
          onClick={() => onEdit(product)}
          className="action-link"
          disabled={isAnyDeleting}
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(product.id)}
          className="action-link delete"
          disabled={isAnyDeleting}
        >
          {isDeleting ? 'Menghapus...' : 'Hapus'}
        </button>
      </td>
    </tr>
  );
};

export default ProductRow;