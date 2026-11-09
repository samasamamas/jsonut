
import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Product, ProductFormData } from '../types/data_type';

interface ProductFormProps {
  product: Product | null;
  onSubmit: (
    data: ProductFormData,
    imageFile: File | null
  ) => Promise<void> | void;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface FormState {
  name: string;
  price: string;
  stock: string;
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

const ProductForm = ({
  product,
  onSubmit,
  onClose,
  isSubmitting = false,
}: ProductFormProps) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    price: '',
    stock: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      name: product?.name ?? '',
      price: product ? String(product.price) : '',
      stock: product ? String(product.stock) : '',
    });

    setImageFile(null);
    setImagePreview(product?.image ? getImageUrl(product.image) : '');
    setError('');
  }, [product]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      setError('Nama produk wajib diisi.');
      return;
    }

    if (
      form.price.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError('Harga produk harus berupa angka dan tidak boleh negatif.');
      return;
    }

    if (
      form.stock.trim() === '' ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError('Stok produk harus berupa bilangan bulat dan tidak boleh negatif.');
      return;
    }

    const data: ProductFormData = {
      name,
      price,
      stock,
    };

    try {
      setError('');
      await onSubmit(data, imageFile);
    } catch (err: any) {
      console.error('Gagal menyimpan produk:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan produk. Silakan coba kembali.'
      );
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="modal-content product-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-eyebrow">
              MANAJEMEN PRODUK
            </span>

            <h2>
              {product ? 'Edit Produk' : 'Tambah Produk'}
            </h2>

            <p>
              {product
                ? 'Perbarui informasi produk donat.'
                : 'Tambahkan informasi produk donat.'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="product-form-body">
            <div className="form-group">
              <label htmlFor="name">Nama Produk</label>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Masukkan nama produk"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Harga Produk</label>

                <div className="input-with-prefix">
                  <span>Rp</span>

                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Masukkan harga"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stok Produk</label>

                <input
                  id="stock"
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Masukkan stok"
                  min="0"
                  step="1"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Foto Produk</label>

              <div className="image-upload-area">
                <input
                  id="product-image"
                  className="file-input-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />

                <label
                  htmlFor="product-image"
                  className={`upload-button ${
                    isSubmitting ? 'disabled' : ''
                  }`}
                >
                  Tambah Foto
                </label>

                <span className="field-hint">
                  Format JPG, PNG, atau WEBP. Maksimal 5 MB.
                </span>
              </div>

              {imagePreview && (
                <div className="image-preview-section">
                  <img
                    src={imagePreview}
                    alt="Preview produk"
                    className="image-preview"
                  />

                  <div className="image-preview-info">
                    <strong>
                      {imageFile
                        ? 'Foto produk baru'
                        : 'Foto produk saat ini'}
                    </strong>

                    <p>
                      {imageFile
                        ? imageFile.name
                        : 'Foto lama tetap digunakan jika tidak diganti.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Menyimpan...'
                : product
                  ? 'Simpan Perubahan'
                  : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
