import React, { useState, useEffect } from "react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  receipt_url?: string;
  description?: string;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/payments/history?page=${page}&limit=${limit}`
        );
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        setPayments((prev) => [...prev, ...data.payments]);
        setHasMore(data.hasMore);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && payments.length === 0) {
    return <div className="text-center py-8">Loading payment history...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payment history found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <li key={payment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {payment.description || `Payment ${payment.id}`}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {format(
                          new Date(payment.created * 1000),
                          "MMM d, yyyy h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {(payment.amount / 100).toLocaleString("en-US", {
                          style: "currency",
                          currency: payment.currency.toUpperCase(),
                        })}
                      </p>
                    </div>
                  </div>
                  {payment.receipt_url && (
                    <div className="mt-2">
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasMore && payments.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
