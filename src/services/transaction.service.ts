import { prisma } from '@/lib/prisma';
import { generateTransactionId, generateCertificateNumber } from '@/lib/utils';
import type { TransactionStatus, ShariahStatus, CommodityType, AuditStage } from '@/types';

// ===========================================
// Transaction Service
// ===========================================

export interface CreateTransactionInput {
  customerName: string;
  customerId: string;
  commodityType: CommodityType;
  amount: number;
  currency?: string;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  shariahStatus?: ShariahStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function createTransaction(input: CreateTransactionInput) {
  const transactionId = generateTransactionId();

  const transaction = await prisma.transaction.create({
    data: {
      transactionId,
      customerName: input.customerName,
      customerId: input.customerId,
      commodityType: input.commodityType,
      amount: input.amount,
      currency: input.currency || 'MYR',
      status: 'PENDING',
      shariahStatus: 'PENDING_REVIEW',
    },
  });

  // Create initial audit events (T0, T1, T2) with PENDING status
  await prisma.auditEvent.createMany({
    data: [
      {
        transactionId: transaction.id,
        stage: 'T0',
        stageName: 'WAKALAH_AGREEMENT',
        status: 'PENDING',
      },
      {
        transactionId: transaction.id,
        stage: 'T1',
        stageName: 'QABD',
        status: 'PENDING',
      },
      {
        transactionId: transaction.id,
        stage: 'T2',
        stageName: 'LIQUIDATE',
        status: 'PENDING',
      },
    ],
  });

  // Log the creation
  await prisma.auditLog.create({
    data: {
      transactionId: transaction.id,
      eventType: 'TRANSACTION_CREATED',
      message: `Transaction ${transactionId} created for ${input.customerName}`,
      severity: 'INFO',
      metadata: { customerId: input.customerId, amount: input.amount },
    },
  });

  return transaction;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const { status, shariahStatus, search, page = 1, pageSize = 10 } = filters;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (shariahStatus) {
    where.shariahStatus = shariahStatus;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerId: { contains: search, mode: 'insensitive' } },
      { transactionId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        auditEvents: {
          orderBy: { stage: 'asc' },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      auditEvents: {
        orderBy: { stage: 'asc' },
        include: {
          certificate: true,
        },
      },
      auditLogs: {
        orderBy: { timestamp: 'desc' },
        take: 50,
      },
      aiAuditSummary: true,
    },
  });
}

export async function getTransactionByTransactionId(transactionId: string) {
  return prisma.transaction.findUnique({
    where: { transactionId },
    include: {
      auditEvents: {
        orderBy: { stage: 'asc' },
        include: {
          certificate: true,
        },
      },
      auditLogs: {
        orderBy: { timestamp: 'desc' },
        take: 50,
      },
      aiAuditSummary: true,
    },
  });
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus,
  shariahStatus?: ShariahStatus
) {
  const updateData: Record<string, unknown> = { status };
  if (shariahStatus) {
    updateData.shariahStatus = shariahStatus;
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      transactionId: id,
      eventType: 'STATUS_UPDATED',
      message: `Transaction status updated to ${status}`,
      severity: status === 'VIOLATION' ? 'ERROR' : 'INFO',
    },
  });

  return transaction;
}

export async function processAuditStage(
  transactionId: string,
  stage: AuditStage,
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
) {
  const auditEvent = await prisma.auditEvent.findFirst({
    where: { transactionId, stage },
  });

  if (!auditEvent) {
    throw new Error(`Audit event for stage ${stage} not found`);
  }

  const updateData: Record<string, unknown> = { status };

  // If completing, create certificate and set completion time
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();

    // Create certificate
    const certificateType =
      stage === 'T0'
        ? 'WAKALAH_AGREEMENT'
        : stage === 'T1'
        ? 'QABD_CONFIRMATION'
        : 'LIQUIDATION_CERTIFICATE';

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: generateCertificateNumber(certificateType),
        type: certificateType,
        issuedBy: 'Bursa Malaysia',
        data: generateCertificateData(stage, transactionId),
      },
    });

    updateData.certificateId = certificate.id;
  }

  const updated = await prisma.auditEvent.update({
    where: { id: auditEvent.id },
    data: updateData,
    include: { certificate: true },
  });

  // Log the event
  await prisma.auditLog.create({
    data: {
      transactionId,
      eventType: `${stage}_${status}`,
      message: `Audit stage ${stage} ${status.toLowerCase()}`,
      severity: status === 'FAILED' ? 'ERROR' : 'INFO',
    },
  });

  // Check if all stages are complete
  const allEvents = await prisma.auditEvent.findMany({
    where: { transactionId },
  });

  const allCompleted = allEvents.every((e) => e.status === 'COMPLETED');
  const anyFailed = allEvents.some((e) => e.status === 'FAILED');

  if (allCompleted) {
    await updateTransactionStatus(transactionId, 'COMPLETED', 'COMPLIANT');
  } else if (anyFailed) {
    await updateTransactionStatus(transactionId, 'VIOLATION', 'NON_COMPLIANT');
  } else if (status === 'IN_PROGRESS') {
    await updateTransactionStatus(transactionId, 'PROCESSING', 'PENDING_REVIEW');
  }

  return updated;
}

function generateCertificateData(stage: AuditStage, transactionId: string) {
  const baseData = {
    transactionRef: transactionId,
    generatedAt: new Date().toISOString(),
    bursaRef: `BMD-${Date.now()}`,
  };

  switch (stage) {
    case 'T0':
      return {
        ...baseData,
        documentType: 'WAKALAH_AGREEMENT',
        principalName: 'Customer',
        agentName: 'Bursa Suq As Sila',
        wakalahPurpose: 'Purchase of CPO',
        wakalahFee: 0,
      };
    case 'T1':
      return {
        ...baseData,
        documentType: 'QABD_CONFIRMATION',
        commodityDescription: 'Crude Palm Oil (CPO)',
        quantity: Math.floor(Math.random() * 100) + 1,
        unitPrice: Math.floor(Math.random() * 1000) + 3000,
        bursaTradeRef: `CPO-${Date.now()}`,
      };
    case 'T2':
      return {
        ...baseData,
        documentType: 'LIQUIDATION_CERTIFICATE',
        saleMethod: 'Murabahah',
        buyerName: 'Third Party Buyer',
        profitMargin: 2.5,
        settlementDate: new Date().toISOString(),
      };
    default:
      return baseData;
  }
}

export async function getDashboardStats() {
  const [
    totalTransactions,
    pendingTransactions,
    completedTransactions,
    violationTransactions,
    recentTransactions,
  ] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'PENDING' } }),
    prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    prisma.transaction.count({ where: { status: 'VIOLATION' } }),
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        auditEvents: {
          orderBy: { stage: 'asc' },
        },
      },
    }),
  ]);

  return {
    totalTransactions,
    pendingTransactions,
    completedTransactions,
    violationTransactions,
    recentTransactions,
  };
}
