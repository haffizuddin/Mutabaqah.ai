'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Filter, FileText, Download, RefreshCw, ChevronRight, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatCurrency } from '@/lib/utils';

// Live activity logs for sync
const liveActivityLogs = [
  { customerName: 'Ahmad bin Abdullah', eventType: 'T2_COMPLETED', message: 'Murabahah execution completed', amount: '50000' },
  { customerName: 'Fatimah binti Hassan', eventType: 'T1_COMPLETED', message: 'Qabd confirmed', amount: '75000' },
  { customerName: 'Muhammad Razak', eventType: 'T0_COMPLETED', message: 'Wakalah agreement signed', amount: '100000' },
  { customerName: 'Aminah binti Yusof', eventType: 'T1_FAILED', message: 'Qabd verification failed', amount: '25000' },
  { customerName: 'Ibrahim Hassan', eventType: 'CERTIFICATE_ISSUED', message: 'Certificate issued', amount: '120000' },
  { customerName: 'Zainab binti Omar', eventType: 'T1_COMPLETED', message: 'Qabd confirmed', amount: '85000' },
  { customerName: 'Hafiz bin Ismail', eventType: 'T2_COMPLETED', message: 'Murabahah completed', amount: '45000' },
  { customerName: 'Nurul Aisyah', eventType: 'T0_COMPLETED', message: 'Wakalah signed', amount: '95000' },
];

interface Transaction {
  id: string;
  transactionId: string;
  customerName: string;
  customerId: string;
  commodityType: string;
  amount: string;
  status: string;
  shariahStatus: string;
  createdAt: string;
  auditEvents: Array<{
    stage: string;
    status: string;
  }>;
}

// Demo data with static dates to avoid hydration errors
const demoTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN-20250122-ABC123',
    customerName: 'Ahmad bin Abdullah',
    customerId: 'CUS-001',
    commodityType: 'CPO',
    amount: '50000',
    status: 'COMPLETED',
    shariahStatus: 'COMPLIANT',
    createdAt: '2025-01-22T10:30:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'COMPLETED' },
      { stage: 'T2', status: 'COMPLETED' },
    ],
  },
  {
    id: '2',
    transactionId: 'TXN-20250122-DEF456',
    customerName: 'Fatimah binti Hassan',
    customerId: 'CUS-002',
    commodityType: 'CPO',
    amount: '75000',
    status: 'PROCESSING',
    shariahStatus: 'PENDING_REVIEW',
    createdAt: '2025-01-22T09:15:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'IN_PROGRESS' },
      { stage: 'T2', status: 'PENDING' },
    ],
  },
  {
    id: '3',
    transactionId: 'TXN-20250121-GHI789',
    customerName: 'Muhammad Razak',
    customerId: 'CUS-003',
    commodityType: 'CPO',
    amount: '100000',
    status: 'PENDING',
    shariahStatus: 'PENDING_REVIEW',
    createdAt: '2025-01-21T14:45:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'PENDING' },
      { stage: 'T1', status: 'PENDING' },
      { stage: 'T2', status: 'PENDING' },
    ],
  },
  {
    id: '4',
    transactionId: 'TXN-20250120-JKL012',
    customerName: 'Aminah binti Yusof',
    customerId: 'CUS-004',
    commodityType: 'CPO',
    amount: '25000',
    status: 'VIOLATION',
    shariahStatus: 'NON_COMPLIANT',
    createdAt: '2025-01-20T11:20:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'FAILED' },
      { stage: 'T2', status: 'PENDING' },
    ],
  },
  {
    id: '5',
    transactionId: 'TXN-20250119-MNO345',
    customerName: 'Ibrahim Hassan',
    customerId: 'CUS-005',
    commodityType: 'CPO',
    amount: '120000',
    status: 'COMPLETED',
    shariahStatus: 'COMPLIANT',
    createdAt: '2025-01-19T16:00:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'COMPLETED' },
      { stage: 'T2', status: 'COMPLETED' },
    ],
  },
  {
    id: '6',
    transactionId: 'TXN-20250122-PQR678',
    customerName: 'Zainab binti Omar',
    customerId: 'CUS-006',
    commodityType: 'CPO',
    amount: '85000',
    status: 'PROCESSING',
    shariahStatus: 'PENDING_REVIEW',
    createdAt: '2025-01-22T11:45:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'IN_PROGRESS' },
      { stage: 'T2', status: 'PENDING' },
    ],
  },
  {
    id: '7',
    transactionId: 'TXN-20250122-STU901',
    customerName: 'Hafiz bin Ismail',
    customerId: 'CUS-007',
    commodityType: 'CPO',
    amount: '45000',
    status: 'COMPLETED',
    shariahStatus: 'COMPLIANT',
    createdAt: '2025-01-22T08:20:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'COMPLETED' },
      { stage: 'T1', status: 'COMPLETED' },
      { stage: 'T2', status: 'COMPLETED' },
    ],
  },
  {
    id: '8',
    transactionId: 'TXN-20250121-VWX234',
    customerName: 'Nurul Aisyah',
    customerId: 'CUS-008',
    commodityType: 'CPO',
    amount: '95000',
    status: 'PENDING',
    shariahStatus: 'PENDING_REVIEW',
    createdAt: '2025-01-21T15:30:00.000Z',
    auditEvents: [
      { stage: 'T0', status: 'PENDING' },
      { stage: 'T1', status: 'PENDING' },
      { stage: 'T2', status: 'PENDING' },
    ],
  },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentLiveIndex, setCurrentLiveIndex] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Real-time live sync effect - cycles through 8 entries every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLiveIndex((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentLiveCustomer = liveActivityLogs[currentLiveIndex]?.customerName;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.customerName.toLowerCase().includes(search.toLowerCase()) ||
      txn.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      txn.customerId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      VIOLATION: { bg: 'bg-red-100', text: 'text-red-700', label: 'Violation' },
      CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Cancelled' },
    };
    return config[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
  };

  const getShariahConfig = (status: string) => {
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      COMPLIANT: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Compliant' },
      PENDING_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending Review' },
      NON_COMPLIANT: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Non-Compliant' },
      UNDER_INVESTIGATION: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', label: 'Investigating' },
    };
    return config[status] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', label: status };
  };

  const getProgressIndicator = (events: Array<{ stage: string; status: string }>) => {
    return (
      <div className="flex items-center gap-1">
        {events.map((event) => {
          let bgColor = 'bg-slate-200';
          if (event.status === 'COMPLETED') {
            bgColor = 'bg-green-500';
          } else if (event.status === 'IN_PROGRESS') {
            bgColor = 'bg-blue-500';
          } else if (event.status === 'FAILED') {
            bgColor = 'bg-red-500';
          }
          return (
            <div key={event.stage} className={`w-8 h-2 rounded-full ${bgColor} ${event.status === 'IN_PROGRESS' ? 'animate-pulse' : ''}`} />
          );
        })}
      </div>
    );
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'COMPLETED').length,
    processing: transactions.filter(t => t.status === 'PROCESSING').length,
    pending: transactions.filter(t => t.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">Manage and monitor Tawarruq commodity purchases</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/transactions/new">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-blue-600">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-amber-600">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by customer name, ID, or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-11 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 h-11 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="VIOLATION">Violation</option>
              </select>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Banner */}
      {liveActivityLogs[currentLiveIndex] && (
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                    {liveActivityLogs[currentLiveIndex].customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Live Activity</span>
                  </div>
                  <p className="font-semibold text-slate-900">{liveActivityLogs[currentLiveIndex].customerName}</p>
                  <p className="text-sm text-slate-600">{liveActivityLogs[currentLiveIndex].message}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 mb-1 inline-block">
                  {liveActivityLogs[currentLiveIndex].eventType}
                </span>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(parseFloat(liveActivityLogs[currentLiveIndex].amount))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Transaction List
              </CardTitle>
              <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-green-200 animate-spin border-t-green-500" />
                <p className="text-sm text-slate-500">Loading transactions...</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((txn) => {
                const statusConfig = getStatusConfig(txn.status);
                const shariahConfig = getShariahConfig(txn.shariahStatus);
                const isLive = txn.customerName === currentLiveCustomer;

                return (
                  <Link
                    key={txn.id}
                    href={`/dashboard/transactions/${txn.id}/audit`}
                    className={`flex items-center gap-4 p-4 transition-all duration-500 group ${
                      isLive
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 shadow-md'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`relative hidden sm:flex w-12 h-12 rounded-xl items-center justify-center text-white font-bold shadow-lg ${
                      isLive
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                        : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/20'
                    }`}>
                      {txn.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      {isLive && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`font-semibold transition-colors ${isLive ? 'text-emerald-700' : 'text-slate-900 group-hover:text-green-600'}`}>
                          {txn.customerName}
                        </p>
                        {isLive ? (
                          <Badge variant="success" className="animate-pulse">LIVE</Badge>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-mono">{txn.transactionId}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden md:inline">{txn.customerId}</span>
                        <span className="hidden lg:inline">•</span>
                        <span className="hidden lg:inline">{txn.commodityType}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="hidden md:block">
                      <p className="text-xs text-slate-400 mb-1">Progress</p>
                      {getProgressIndicator(txn.auditEvents)}
                    </div>

                    {/* Shariah Status */}
                    <div className="hidden lg:block text-center">
                      <p className="text-xs text-slate-400 mb-1">Shariah</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${shariahConfig.bg} ${shariahConfig.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${shariahConfig.dot}`} />
                        {shariahConfig.label}
                      </span>
                    </div>

                    {/* Amount & Date */}
                    <div className="text-right">
                      <p className={`font-bold ${isLive ? 'text-emerald-700' : 'text-slate-900'}`}>{formatCurrency(parseFloat(txn.amount))}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(txn.createdAt)}</p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className={`h-9 w-9 ${isLive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-green-600'}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ChevronRight className={`h-4 w-4 transition-colors ${isLive ? 'text-emerald-500' : 'text-slate-300 group-hover:text-green-500'}`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
