import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import type { Transaction } from '../types/data_type';

const ITEMS_PER_PAGE = 5;

interface TransactionDetail {
  id: number;
  transaction_id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  subtotal: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionDetail[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Mengambil data transaksi
  const getTransactions = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axiosClient.get<ApiResponse<Transaction[]>>(
        '/api/transactions'
      );

      if (
        !response.data ||
        response.data.success !== true ||
        !Array.isArray(response.data.data)
      ) {
        throw new Error(
          response.data?.message ||
            'Respons data transaksi dari server tidak valid.'
        );
      }

      setTransactions(response.data.data);
      setCurrentPage(1);
    } catch (error: unknown) {
      console.error('Gagal mengambil transaksi:', error);

      setErrorMsg(
        getErrorMessage(
          error,
          'Gagal mengambil data transaksi dari server.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getTransactions();
  }, [getTransactions]);

  // Mengambil detail transaksi
  const getTransactionDetails = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetails([]);
    setDetailError('');
    setIsLoadingDetail(true);

    try {
      const response = await axiosClient.get<
        ApiResponse<TransactionDetail[]>
      >(
        `/api/transaction-details/transaction/${encodeURIComponent(
          transaction.id
        )}`
      );

      if (
        !response.data ||
        response.data.success !== true ||
        !Array.isArray(response.data.data)
      ) {
        throw new Error(
          response.data?.message ||
            'Respons detail transaksi dari server tidak valid.'
        );
      }

      setTransactionDetails(response.data.data);
    } catch (error: unknown) {
      console.error('Gagal mengambil detail transaksi:', error);

      setDetailError(
        getErrorMessage(
          error,
          'Gagal mengambil detail transaksi dari server.'
        )
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Menutup modal detail
  const closeDetail = () => {
    setSelectedTransaction(null);
    setTransactionDetails([]);
    setDetailError('');
    setIsLoadingDetail(false);
  };

  // Pencarian dan filter tanggal
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch = transaction.id
        .toLowerCase()
        .includes(keyword);

      const transactionDate = new Date(transaction.created_at);

      if (isNaN(transactionDate.getTime())) {
        return false;
      }

      const year = transactionDate.getFullYear();
      const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const day = String(transactionDate.getDate()).padStart(2, '0');

      const dateOnly = `${year}-${month}-${day}`;

      const matchesStartDate = !startDate || dateOnly >= startDate;
      const matchesEndDate = !endDate || dateOnly <= endDate;

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [transactions, search, startDate, endDate]);

  const totalPages =
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Kembali ke halaman pertama ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  // Menyesuaikan halaman jika jumlah data berubah
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleReset = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) => {
    if (!date) return '-';

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tampilan loading
  if (isLoading) {
    return (
      <div className="transaction-message transaction-loading" role="status">
        <span className="transaction-loading-spinner" />
        <strong>Memuat data transaksi...</strong>
      </div>
    );
  }

  // Tampilan error
  if (errorMsg) {
    return (
      <div
        className="transaction-message transaction-error"
        role="alert"
      >
        <strong>Gagal Memuat Transaksi</strong>
        <p>{errorMsg}</p>

        <button
          type="button"
          onClick={getTransactions}
          disabled={isLoading}
          className="transaction-button transaction-button-retry"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="transaction-page">
      <div className="transaction-toolbar">
        <input
          type="text"
          placeholder="Cari ID transaksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="transaction-search"
        />

        <div className="transaction-date-filter">
          <label>
            Tanggal Mulai
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            Tanggal Akhir
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="transaction-button transaction-button-reset"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={getTransactions}
          disabled={isLoading}
          className="transaction-button transaction-button-reload"
        >
          Muat Ulang
        </button>
      </div>

      <div className="transaction-table-wrapper">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Tanggal</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Jenis Pesanan</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="transaction-id">
                    {transaction.id}
                  </td>

                  <td>{formatDate(transaction.created_at)}</td>

                  <td className="transaction-amount">
                    {formatRupiah(transaction.total_amount)}
                  </td>

                  <td>{transaction.payment_method || '-'}</td>

                  <td>
                    {transaction.order_type === 'offline'
                      ? 'Offline'
                      : transaction.order_type}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => getTransactionDetails(transaction)}
                      disabled={isLoadingDetail}
                      className="transaction-button transaction-button-detail"
                    >
                      {isLoadingDetail &&
                      selectedTransaction?.id === transaction.id
                        ? 'Memuat...'
                        : 'Detail'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="transaction-empty">
                  <div className="transaction-empty-state">
                    <strong>
                      {transactions.length === 0
                        ? 'Belum ada transaksi.'
                        : 'Transaksi tidak ditemukan.'}
                    </strong>

                    <span>
                      {transactions.length === 0
                        ? 'Data transaksi akan muncul di sini.'
                        : 'Coba ubah kata kunci atau rentang tanggal.'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="transaction-pagination">
        <span>
          Menampilkan {paginatedTransactions.length} dari{' '}
          {filteredTransactions.length} transaksi
        </span>

        <div>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            Sebelumnya
          </button>

          <span className="transaction-page-info">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Berikutnya
          </button>
        </div>
      </div>

      {selectedTransaction && (
        <div className="transaction-modal-overlay">
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <div className="transaction-modal-header">
              <div>
                <span className="transaction-modal-eyebrow">
                  INFORMASI PESANAN
                </span>

                <h3 id="transaction-modal-title">
                  Detail Transaksi
                </h3>

                <p>{selectedTransaction.id}</p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                className="transaction-modal-close"
                aria-label="Tutup detail transaksi"
              >
                ×
              </button>
            </div>

            <div className="transaction-modal-info">
              <p>
                <strong>Tanggal:</strong>{' '}
                {formatDate(selectedTransaction.created_at)}
              </p>

              <p>
                <strong>Pembayaran:</strong>{' '}
                {selectedTransaction.payment_method || '-'}
              </p>

              <p>
                <strong>Jenis Pesanan:</strong>{' '}
                {selectedTransaction.order_type === 'offline'
                  ? 'Offline'
                  : selectedTransaction.order_type}
              </p>
            </div>

            <h4>Produk yang Dibeli</h4>

            {isLoadingDetail ? (
              <div className="transaction-detail-loading" role="status">
                <span className="transaction-loading-spinner" />
                <p>Memuat detail produk...</p>
              </div>
            ) : detailError ? (
              <div className="transaction-inline-error" role="alert">
                <strong>Gagal Memuat Detail</strong>
                <p>{detailError}</p>

                <button
                  type="button"
                  onClick={() =>
                    getTransactionDetails(selectedTransaction)
                  }
                  disabled={isLoadingDetail}
                  className="transaction-button transaction-button-retry"
                >
                  Coba Lagi
                </button>
              </div>
            ) : transactionDetails.length > 0 ? (
              <div className="transaction-detail-table-wrapper">
                <table className="transaction-table transaction-detail-table">
                  <thead>
                    <tr>
                      <th>Nama Produk</th>
                      <th>Harga</th>
                      <th>Jumlah</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactionDetails.map((detail) => (
                      <tr key={detail.id}>
                        <td>
                          {detail.product_name || 'Produk tidak ditemukan'}
                        </td>

                        <td>{formatRupiah(detail.price_at_time)}</td>

                        <td>{detail.quantity}</td>

                        <td>{formatRupiah(detail.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="transaction-detail-empty">
                Belum ada detail produk untuk transaksi ini.
              </div>
            )}

            <div className="transaction-modal-total">
              <strong>Total Pembayaran</strong>

              <strong>
                {formatRupiah(selectedTransaction.total_amount)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}