'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Shield,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  violationTransactions: number;
  recentTransactions: Array<{
    id: string;
    transactionId: string;
    customerName: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  recentLogs: Array<{
    id: string;
    eventType: string;
    message: string;
    severity: string;
    timestamp: string;
    customerName?: string;
    amount?: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Real-time event rotation effect - cycles through 8 entries
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demo data with more entries for live effect
  const displayStats = stats || {
    totalTransactions: 1247,
    pendingTransactions: 23,
    completedTransactions: 1189,
    violationTransactions: 5,
    recentTransactions: [
      { id: '1', transactionId: 'TXN-20250122-ABC123', customerName: 'Ahmad bin Abdullah', amount: '50000', status: 'COMPLETED', createdAt: '2025-01-22T10:30:00.000Z' },
      { id: '2', transactionId: 'TXN-20250122-DEF456', customerName: 'Fatimah binti Hassan', amount: '75000', status: 'PROCESSING', createdAt: '2025-01-22T09:15:00.000Z' },
      { id: '3', transactionId: 'TXN-20250121-GHI789', customerName: 'Muhammad Razak', amount: '100000', status: 'PENDING', createdAt: '2025-01-21T14:45:00.000Z' },
      { id: '4', transactionId: 'TXN-20250121-JKL012', customerName: 'Aminah binti Yusof', amount: '25000', status: 'VIOLATION', createdAt: '2025-01-21T11:20:00.000Z' },
      { id: '5', transactionId: 'TXN-20250120-MNO345', customerName: 'Ibrahim Hassan', amount: '120000', status: 'COMPLETED', createdAt: '2025-01-20T16:00:00.000Z' },
      { id: '6', transactionId: 'TXN-20250122-PQR678', customerName: 'Zainab binti Omar', amount: '85000', status: 'PROCESSING', createdAt: '2025-01-22T11:45:00.000Z' },
      { id: '7', transactionId: 'TXN-20250122-STU901', customerName: 'Hafiz bin Ismail', amount: '45000', status: 'COMPLETED', createdAt: '2025-01-22T08:20:00.000Z' },
      { id: '8', transactionId: 'TXN-20250121-VWX234', customerName: 'Nurul Aisyah', amount: '95000', status: 'PENDING', createdAt: '2025-01-21T15:30:00.000Z' },
    ],
    recentLogs: [
      { id: '1', eventType: 'T2_COMPLETED', message: 'Murabahah execution completed', severity: 'INFO', timestamp: '2025-01-22T10:30:00.000Z', customerName: 'Ahmad bin Abdullah', amount: '50000' },
      { id: '2', eventType: 'T1_COMPLETED', message: 'Qabd confirmed - commodity purchased', severity: 'INFO', timestamp: '2025-01-22T10:29:00.000Z', customerName: 'Fatimah binti Hassan', amount: '75000' },
      { id: '3', eventType: 'T0_COMPLETED', message: 'Wakalah agreement signed', severity: 'INFO', timestamp: '2025-01-22T10:28:00.000Z', customerName: 'Muhammad Razak', amount: '100000' },
      { id: '4', eventType: 'T1_FAILED', message: 'Qabd verification failed', severity: 'ERROR', timestamp: '2025-01-22T10:27:00.000Z', customerName: 'Aminah binti Yusof', amount: '25000' },
      { id: '5', eventType: 'CERTIFICATE_ISSUED', message: 'Liquidation certificate issued', severity: 'INFO', timestamp: '2025-01-22T10:26:00.000Z', customerName: 'Ibrahim Hassan', amount: '120000' },
      { id: '6', eventType: 'T1_COMPLETED', message: 'Qabd confirmed - commodity purchased', severity: 'INFO', timestamp: '2025-01-22T10:25:00.000Z', customerName: 'Zainab binti Omar', amount: '85000' },
      { id: '7', eventType: 'T2_COMPLETED', message: 'Murabahah execution completed', severity: 'INFO', timestamp: '2025-01-22T10:24:00.000Z', customerName: 'Hafiz bin Ismail', amount: '45000' },
      { id: '8', eventType: 'T0_COMPLETED', message: 'Wakalah agreement signed', severity: 'INFO', timestamp: '2025-01-22T10:23:00.000Z', customerName: 'Nurul Aisyah', amount: '95000' },
    ],
  };

  const statCards = [
    {
      title: 'Total Transactions',
      value: displayStats.totalTransactions.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Pending Review',
      value: displayStats.pendingTransactions.toString(),
      change: '-3',
      trend: 'down',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-500',
    },
    {
      title: 'Completed',
      value: displayStats.completedTransactions.toLocaleString(),
      change: '+18',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Violations',
      value: displayStats.violationTransactions.toString(),
      change: '0',
      trend: 'neutral',
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-500',
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'warning' | 'info' | 'error'; label: string }> = {
      COMPLETED: { variant: 'success', label: 'Completed' },
      PROCESSING: { variant: 'info', label: 'Processing' },
      PENDING: { variant: 'warning', label: 'Pending' },
      VIOLATION: { variant: 'error', label: 'Violation' },
    };
    const { variant, label } = config[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getSeverityDot = (severity: string) => {
    const colors: Record<string, string> = {
      INFO: 'bg-blue-500',
      WARNING: 'bg-amber-500',
      ERROR: 'bg-red-500',
      CRITICAL: 'bg-red-700',
    };
    return <span className={`w-2 h-2 rounded-full ${colors[severity] || 'bg-gray-500'}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-green-200 animate-spin border-t-green-500" />
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-green-600" />
          </div>
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor your Tawarruq transactions and Shariah compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/transactions/new">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25">
              <Zap className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-gradient-to-br ${stat.color} opacity-10`} />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center gap-1.5">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="h-4 w-4 text-amber-500" />
                    ) : (
                      <span className="h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-amber-600' : 'text-slate-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-slate-400">vs last week</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Transactions - Takes 3 columns */}
        <Card className="lg:col-span-3 bg-white border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest Tawarruq commodity purchases</CardDescription>
            </div>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayStats.recentTransactions.map((txn) => {
                const isActive = displayStats.recentLogs[currentLogIndex]?.customerName === txn.customerName;
                return (
                  <Link
                    key={txn.id}
                    href={`/dashboard/transactions/${txn.id}/audit`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-lg shadow-emerald-100 scale-[1.02]'
                        : 'bg-slate-50/50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/40'
                          : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25'
                      }`}>
                        {txn.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-900 group-hover:text-green-600'}`}>
                          {txn.customerName}
                        </p>
                        <p className="text-sm text-slate-500">{txn.transactionId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatCurrency(parseFloat(txn.amount))}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(txn.createdAt)}</p>
                      </div>
                      {isActive ? (
                        <Badge variant="success" className="animate-pulse">
                          LIVE
                        </Badge>
                      ) : (
                        getStatusBadge(txn.status)
                      )}
                      <Eye className={`h-4 w-4 transition-opacity ${isActive ? 'text-emerald-500 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Activity
              </CardTitle>
              <CardDescription>Real-time system events</CardDescription>
            </div>
            <Link href="/dashboard/monitor">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                Monitor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {/* Current Event Highlight */}
            {displayStats.recentLogs[currentLogIndex] && (
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 transition-all duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    {displayStats.recentLogs[currentLogIndex].eventType}
                  </span>
                  <span className="text-xs text-emerald-600">{formatDateTime(displayStats.recentLogs[currentLogIndex].timestamp)}</span>
                </div>
                <p className="font-semibold text-slate-900 mb-1">{displayStats.recentLogs[currentLogIndex].customerName}</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(parseFloat(displayStats.recentLogs[currentLogIndex].amount || '0'))}</p>
                <p className="text-sm text-slate-600 mt-1">{displayStats.recentLogs[currentLogIndex].message}</p>
              </div>
            )}
            <div className="space-y-3">
              {displayStats.recentLogs.map((log, index) => (
                <div
                  key={log.id}
                  className={`flex gap-3 p-2 rounded-lg transition-all duration-300 ${index === currentLogIndex ? 'bg-emerald-50/50 border border-emerald-100' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    {getSeverityDot(log.severity)}
                    {index < displayStats.recentLogs.length - 1 && (
                      <div className="w-px h-full bg-slate-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {log.eventType}
                      </span>
                      {log.amount && (
                        <span className="text-xs font-semibold text-emerald-600">
                          {formatCurrency(parseFloat(log.amount))}
                        </span>
                      )}
                    </div>
                    {log.customerName && (
                      <p className="text-sm font-medium text-slate-800">{log.customerName}</p>
                    )}
                    <p className="text-xs text-slate-500">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Shariah Compliance Overview</CardTitle>
          <CardDescription>AI-powered analysis of your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50">
              <div className="p-3 rounded-xl bg-green-500 shadow-lg shadow-green-500/25">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">98.2%</p>
                <p className="text-sm text-green-600">Overall Compliance Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50">
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">1,189</p>
                <p className="text-sm text-blue-600">Verified Transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
              <div className="p-3 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/25">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">23</p>
                <p className="text-sm text-amber-600">Pending AI Review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
