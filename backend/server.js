const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./lib/prisma');
const StripePayment = require('./utils/stripe');
const { setupStatisticsCronJobs } = require('./utils/cron-jobs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const vnpayPaymentRoutes = require('./routes/vnpaypayment');
const billingRoutes = require('./routes/billing');
const organizationRoutes = require('./routes/organization');
const stripePaymentRoutes = require('./routes/stripepayment');
const statisticsRoutes = require('./routes/statisticRoute');

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_API_URL?.replace(/:\d+$/, ':3000') || 'http://localhost:3000', // URL của Next.js
  credentials: true
}));

//khơi động cron jobs
setupStatisticsCronJobs();

// Webhook endpoint cho Stripe
app.post('/api/payment/stripe/webhook', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripePayment = new StripePayment(process.env.STRIPE_SECRET_KEY);

    try {
      const event = stripePayment.constructWebhookEvent(req.body, sig);

      console.log('=== Stripe Webhook Event ===');
      console.log('Type:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('Checkout Session Completed:', session.id);
          console.log('Metadata:', session.metadata);
          
          const orderId = session.metadata.orderId;
          const organizationId = session.metadata.organizationId;
          const planId = session.metadata.planId;
          
          // Tìm payment trong database
          const payment = await prisma.payment.findUnique({
            where: { orderId: orderId }
          });

          if (payment) {
            // Cập nhật payment
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'success',
                stripePaymentIntentId: session.payment_intent,
                paidAt: new Date(),
                rawResponse: session
              }
            });

            console.log('Payment updated to success');

            // Cập nhật subscription VÀ organization
            await createOrUpdateSubscription(organizationId, planId, session);
          } else {
            console.error('Payment not found for order:', orderId);
          }
          break;

        case 'payment_intent.succeeded':
          console.log('Payment Intent Succeeded:', event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          console.log('Payment Intent Failed:', event.data.object.id);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

// Helper function tạo, cập nhật subscription
async function createOrUpdateSubscription(organizationId, planId, sessionData) {
  try {
    console.log('=== Creating/Updating Subscription ===');
    console.log('Organization ID:', organizationId);
    console.log('Plan ID:', planId);

    const billingCycle = sessionData.metadata.billingCycle || 'monthly';
    const daysToAdd = billingCycle === 'yearly' ? 365 : 30;
    const orderId = sessionData.metadata.orderId;

    // Tính endDate theo billing cycle
    const endDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    // Lấy thông tin plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    console.log('Plan found:', plan.name, plan.storageLimitGb, 'GB');

    // Cập nhật Organization với plan mới
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        planId: plan.id,
        storageLimitGb: plan.storageLimitGb,
        updatedAt: new Date()
      }
    });

    console.log('Organization updated with new plan');

    // Kiểm tra subscription hiện tại
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        organizationId: organizationId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      // Cập nhật subscription hiện tại
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: plan.id,
          stripeSubscriptionId: sessionData.subscription || sessionData.id,
          paymentMethod: 'stripe',
          startDate: new Date(),
          endDate: endDate,
          updatedAt: new Date()
        }
      });
      await prisma.payment.update({
        where: { orderId: orderId },
        data: {
          subscriptionId: existingSubscription.id
        }
      })

      console.log('Subscription updated');
    } else {
      // Tạo subscription mới
      const newSubscription = await prisma.subscription.create({
        data: {
          organizationId: organizationId,
          planId: plan.id,
          stripeSubscriptionId: sessionData.subscription || sessionData.id,
          paymentMethod: 'stripe',
          status: 'active',
          startDate: new Date(),
          endDate: endDate
        }
      });

      await prisma.payment.update({
        where: { orderId: orderId },
        data: {
          subscriptionId: newSubscription.id
        }
      })

      console.log('New subscription created');
    }

  } catch (error) {
    console.error('Error in createOrUpdateSubscription:', error);
    throw error;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sử dụng routes
app.use(vnpayPaymentRoutes);
app.use(billingRoutes);
app.use(organizationRoutes);
app.use(stripePaymentRoutes);
app.use(statisticsRoutes);

// test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running!', status: 'OK' });
});


app.get('/api/files', (req, res) => {
  res.json({ files: [] });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});