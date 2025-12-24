const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./lib/prisma');
const StripePayment = require('./utils/stripe');
const { setupStatisticsCronJobs } = require('./utils/cron-jobs');
const { createOrUpdateSubscription } = require('./utils/createOrUpdateSubcription');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const vnpayPaymentRoutes = require('./routes/vnpaypayment');
const billingRoutes = require('./routes/billing');
const organizationRoutes = require('./routes/organization');
const stripePaymentRoutes = require('./routes/stripepayment');
const statisticsRoutes = require('./routes/statisticRoute');
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");
const logsRoutes = require("./routes/logs");

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL?.replace(/:\d+$/, ':3000') || 'http://localhost:3000', // URL của Next.js
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

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

// Sử dụng routes
app.use(vnpayPaymentRoutes);
app.use(billingRoutes);
app.use(organizationRoutes);
app.use(stripePaymentRoutes);
app.use(statisticsRoutes);
app.use(authRoutes);
app.use(fileRoutes);
app.use(logsRoutes);

// test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running!', status: 'OK' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});