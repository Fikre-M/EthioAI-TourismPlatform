import { useState, useEffect } from 'react';
import { getPaymentHistory, getInvoices } from '../utils/api';

export const usePaymentHistory = (customerId) => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchPayments = async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const [paymentsData, invoicesData] = await Promise.all([
        getPaymentHistory(c