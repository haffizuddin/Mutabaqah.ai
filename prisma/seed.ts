import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mutabaqah.ai' },
    update: {},
    create: {
      email: 'admin@mutabaqah.ai',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@mutabaqah.ai' },
    update: {},
    create: {
      email: 'demo@mutabaqah.ai',
      name: 'Demo User',
      password: userPassword,
      role: 'OPERATOR',
    },
  });
  console.log('Created demo user:', demoUser.email);

  // Create sample transactions
  const transactions = [
    {
      transactionId: 'TXN-20250122-DEMO01',
      customerName: 'Ahmad bin Abdullah',
      customerId: 'CUS-001',
      commodityType: 'CPO' as const,
      amount: 50000,
      status: 'COMPLETED' as const,
      shariahStatus: 'COMPLIANT' as const,
    },
    {
      transactionId: 'TXN-20250122-DEMO02',
      customerName: 'Fatimah binti Hassan',
      customerId: 'CUS-002',
      commodityType: 'CPO' as const,
      amount: 75000,
      status: 'PROCESSING' as const,
      shariahStatus: 'PENDING_REVIEW' as const,
    },
    {
      transactionId: 'TXN-20250121-DEMO03',
      customerName: 'Muhammad Razak',
      customerId: 'CUS-003',
      commodityType: 'CPO' as const,
      amount: 100000,
      status: 'PENDING' as const,
      shariahStatus: 'PENDING_REVIEW' as const,
    },
  ];

  for (const txn of transactions) {
    const existing = await prisma.transaction.findUnique({
      where: { transactionId: txn.transactionId },
    });

    if (!existing) {
      const transaction = await prisma.transaction.create({
        data: txn,
      });

      // Create audit events
      const stages = [
        { stage: 'T0' as const, name: 'WAKALAH_AGREEMENT', status: txn.status === 'COMPLETED' ? 'COMPLETED' : txn.status === 'PROCESSING' ? 'COMPLETED' : 'PENDING' },
        { stage: 'T1' as const, name: 'QABD', status: txn.status === 'COMPLETED' ? 'COMPLETED' : txn.status === 'PROCESSING' ? 'IN_PROGRESS' : 'PENDING' },
        { stage: 'T2' as const, name: 'LIQUIDATE', status: txn.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING' },
      ];

      for (const stage of stages) {
        const event = await prisma.auditEvent.create({
          data: {
            transactionId: transaction.id,
            stage: stage.stage,
            stageName: stage.name,
            status: stage.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
            completedAt: stage.status === 'COMPLETED' ? new Date() : null,
          },
        });

        // Create certificate for completed stages
        if (stage.status === 'COMPLETED') {
          const certType = stage.stage === 'T0' ? 'WAKALAH_AGREEMENT' : stage.stage === 'T1' ? 'QABD_CONFIRMATION' : 'LIQUIDATION_CERTIFICATE';
          const cert = await prisma.certificate.create({
            data: {
              certificateNumber: `CERT-${certType.substring(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              type: certType,
              issuedBy: 'Bursa Suq As Sila',
              data: {
                transactionRef: transaction.transactionId,
                generatedAt: new Date().toISOString(),
                documentType: certType,
              },
            },
          });

          await prisma.auditEvent.update({
            where: { id: event.id },
            data: { certificateId: cert.id },
          });
        }
      }

      // Create AI audit summary for completed transactions
      if (txn.status === 'COMPLETED') {
        await prisma.aiAuditSummary.create({
          data: {
            transactionId: transaction.id,
            summary: `Tawarruq transaction ${txn.transactionId} for ${txn.customerName} involving CPO worth MYR ${txn.amount}. The transaction demonstrates excellent Shariah compliance with all stages properly executed.`,
            complianceScore: 95,
            findings: [],
            recommendations: [
              'Transaction follows proper Tawarruq sequence',
              'All certificates are in order',
              'Continue monitoring for any anomalies',
            ],
            generatedBy: 'simulated',
          },
        });
      }

      console.log('Created transaction:', transaction.transactionId);
    }
  }

  // Create sample audit logs
  const logs = [
    { eventType: 'SYSTEM_STARTUP', message: 'Mutabaqah.ai system initialized', severity: 'INFO' as const },
    { eventType: 'USER_LOGIN', message: 'Admin user logged in', severity: 'INFO' as const },
    { eventType: 'TRANSACTION_CREATED', message: 'New transaction created for Ahmad bin Abdullah', severity: 'INFO' as const },
  ];

  for (const log of logs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
