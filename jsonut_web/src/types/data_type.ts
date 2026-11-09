export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
}

export interface Transaction {
  id: string;
  user_id: number | null;
  total_amount: number;
  payment_method: string | null;
  status: string;
  order_type: string;
  created_at: string;
}

export type ActiveTab =
  | 'Dashboard'
  | 'Produk'
  | 'Stok'
  | 'Transaksi';