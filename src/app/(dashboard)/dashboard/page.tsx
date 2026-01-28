'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Shield,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import LiveActivityFeed from '@/components/dashboard/LiveActivityFeed';
import {
  demoTransactions,
  getDemoStats,
  DemoTransaction,
} from '@/data/demo-transactions';

export default function DashboardPage() {
  const router = useRouter();
  const [displayedTransactions, setDisplayedTransactions] = useState<DemoTransaction[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [autoResolvedCount] = useState(7);

  // Get stats from demo data
  const stats = useMemo(() => getDemoStats(), []);

  // Pool of transactions (use ref to avoid re-render loops)
  const poolRef = useRef<DemoTransaction[]>([]);
  const isInitialized = useRef(false);

  // Shuffle array function
  const shuffleArray = (array: DemoTransaction[]): DemoTransaction[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize displayed transactions and pool (only once)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const shuffled = shuffleArray(demoTransactions);
    setDisplayedTransactions(shuffled.slice(0, 10));
    poolRef.current = shuffled.slice(10);
  }, []);

  // Rotate transactions - pick random from pool, add to top
  useEffect(() => {
    const interval = setInterval(() => {
      const pool = poolRef.current;
      if (!pool || pool.length === 0) return;

      setDisplayedTransactions((current) => {
        if (!current || current.length === 0) return current;

        // Pick random transaction from pool
        const randomIndex = Math.floor(Math.random() * pool.length);
        const nextTxn = pool[randomIndex];

        // Safety check
        if (!nextTxn) return current;

        // Swap: remove picked from pool, add removed item back
        const removedTxn = current[current.length - 1];
        if (removedTxn) {
          poolRef.current = [
            ...pool.slice(0, randomIndex),
            ...pool.slice(randomIndex + 1),
            removedTxn,
          ];
        }

        // Add new at top, remove last
        return [nextTxn, ...current.slice(0, 9)];
      });

      setRotationIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Generate live activity logs from displayed transactions
  const recentLogs = useMemo(() => {
    return displayedTransactions.slice(0, 8).map((txn) => {
      const latestEvent = txn.auditEvents.find(
        (e) => e.status === 'COMPLETED' || e.status === 'IN_PROGRESS' || e.status === 'FAILED'
      );

      const eventType = latestEvent
        ? `${latestEvent.stage}_${latestEvent.status}`
        : 'SYSTEM_UPDATE';

      const messages: Record<string, string> = {
        'T0_COMPLETED': 'Wakalah agreement signed',
        'T1_COMPLETED': 'Qabd confirmed',
        'T2_COMPLETED': 'Murabahah completed',
        'T0_IN_PROGRESS': 'Processing Wakalah',
        'T1_IN_PROGRESS': 'Processing Qabd',
        'T2_IN_PROGRESS': 'Processing Liquidation',
        'T0_FAILED': 'Wakalah verification failed',
        'T1_FAILED': 'Qabd verification failed',
        'T2_FAILED': 'Liquidation verification failed',
        'T0_PENDING': 'Awaiting Wakalah',
      };

      return {
        id: `log-${txn.id}`,
        eventType,
        message: messages[eventType] || 'Transaction processing',
        severity: latestEvent?.status === 'FAILED' ? 'ERROR' : 'INFO',
        timestamp: txn.updatedAt,
        customerName: txn.customerName,
        amount: txn.amount,
      };
    });
  }, [displayedTransactions]);

  // Cycle through current active item
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % Math.max(recentLogs.length, 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [recentLogs.length]);

  const handleViolationsCardClick = useCallback(() => {
    router.push('/dashboard/transactions?status=VIOLATION');
  }, [router]);

  const handleAutoResolvedClick = useCallback(() => {
    router.push('/dashboard/auto-resolved');
  }, [router]);

  // Memoized stat cards
  const statCards = useMemo(() => [
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      clickable: false,
    },
    {
      title: 'Pending Review',
      value: stats.pendingTransactions.toString(),
      change: '-3',
      trend: 'down',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      clickable: false,
    },
    {
      title: 'Completed',
      value: stats.completedTransactions.toLocaleString(),
      change: '+18',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
      clickable: false,
    },
    {
      title: 'Violations',
      value: stats.violationTransactions.toString(),
      change: '0',
      trend: 'neutral',
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-500',
      clickable: true,
      onClick: handleViolationsCardClick,
    },
    {
      title: 'Auto Resolved',
      value: autoResolvedCount.toString(),
      change: '+5',
      trend: 'up',
      icon: RotateCcw,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      clickable: true,
      onClick: handleAutoResolvedClick,
    },
  ], [stats, handleViolationsCardClick, handleAutoResolvedClick, autoResolvedCount]);

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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={`relative overflow-hidden bg-white border border-slate-200 shadow-sm ${
              stat.clickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''
            }`}
            onClick={stat.clickable ? stat.onClick : undefined}
          >
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
              {stat.clickable && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className={`text-xs font-medium flex items-center gap-1 ${stat.title === 'Violations' ? 'text-red-600' : 'text-purple-600'}`}>
                    Click to view {stat.title.toLowerCase()} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5 items-stretch">
        {/* Recent Transactions - Takes 3 columns */}
        <Card className="lg:col-span-3 bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden">
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
          <CardContent className="flex-1 overflow-hidden">
            <div className="space-y-2">
              {displayedTransactions.map((txn, index) => {
                const isActive = recentLogs[currentLogIndex]?.customerName === txn.customerName;
                const isNew = index === 0;
                return (
                  <Link
                    key={`${txn.id}-${rotationIndex}`}
                    href={`/dashboard/transactions/${txn.id}/audit`}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-lg shadow-emerald-100 scale-[1.02]'
                        : isNew
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 animate-pulse'
                        : 'bg-slate-50/50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-lg flex-shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/40'
                          : isNew
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/40'
                          : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25'
                      }`}>
                        {txn.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        {(isActive || isNew) && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isNew ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm transition-colors truncate ${isActive ? 'text-emerald-700' : isNew ? 'text-blue-700' : 'text-slate-900 group-hover:text-green-600'}`}>
                          {txn.customerName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{txn.transactionId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p className={`font-bold text-sm ${isActive ? 'text-emerald-700' : isNew ? 'text-blue-700' : 'text-slate-900'}`}>
                          {formatCurrency(parseFloat(txn.amount))}
                        </p>
                        <p className="text-xs text-slate-400 hidden sm:block">{formatDateTime(txn.createdAt)}</p>
                      </div>
                      {isActive ? (
                        <Badge variant="success" className="animate-pulse text-xs">
                          LIVE
                        </Badge>
                      ) : isNew ? (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          NEW
                        </Badge>
                      ) : (
                        <span className="hidden sm:inline">{getStatusBadge(txn.status)}</span>
                      )}
                      <Eye className={`h-4 w-4 transition-opacity hidden sm:block ${isActive ? 'text-emerald-500 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed - Takes 2 columns */}
        <LiveActivityFeed logs={recentLogs} currentIndex={currentLogIndex} />
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
                <p className="text-2xl font-bold text-green-700">
                  {((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Overall Compliance Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50">
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.completedTransactions.toLocaleString()}</p>
                <p className="text-sm text-blue-600">Verified Transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
              <div className="p-3 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/25">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pendingTransactions}</p>
                <p className="text-sm text-amber-600">Pending AI Review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
