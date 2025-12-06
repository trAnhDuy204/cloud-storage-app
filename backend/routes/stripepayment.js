const express = require('express');
const router = express.Router();
const StripePayment = require('../utils/stripe');
const prisma = require('../lib/prisma');

const stripePayment = new StripePayment(process.env.STRIPE_SECRET_KEY);

// Tạo Thanh toán Stripe
router.post('/api/payment/stripe/create', async (req, res) => {
  try {
    const { planId, billingCycle, organizationId, userEmail } = req.body;
    
    console.log('=== Stripe Payment Request ===');
    console.log('Body:', req.body);
    
    if (!planId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Lấy plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Plan not found' 
      });
    }

    // Tính tiền
    let amountUsd = plan.priceUsd;
    if (billingCycle === 'yearly') {
      amountUsd = plan.priceUsd * 10;
    }

    // Chuyển USD sang VND
    const amountVnd = Math.round(amountUsd * 25000);

    console.log('Amount USD:', amountUsd);
    console.log('Amount VND:', amountVnd);

    if (amountUsd <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot process free plan with Stripe' 
      });
    }

    // Tạo orderId
    const orderId = `ORD${Date.now()}`;

    // OrderInfo
    const orderInfo = `Thanh toan goi ${plan.name.replace(/[^a-zA-Z0-9 ]/g, '')} ${billingCycle}`;
    
    // Lấy IP
    let ipAddr = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 '127.0.0.1';
    
    // Nếu IP là IPv6 localhost, đổi thành IPv4
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    
    // lấy IP đầu tiên
    if (ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }

    console.log('Order Info:', orderInfo);
    console.log('IP Address:', ipAddr);

    // Lưu payment vào database
    const payment = await prisma.payment.create({
      data: {
        organizationId: organizationId,
        planId: planId,
        orderId: orderId,
        paymentMethod: 'stripe',
        amountUsd: amountUsd,
        amountVnd: amountVnd,
        currency: 'USD',
        status: 'pending',
        ipAddress: ipAddr,
        description: orderInfo,
        returnUrl: process.env.STRIPE_RETURN_URL
      }
    });

    // Tạo Stripe Checkout
    const session = await stripePayment.createCheckoutSession(
      orderId,
      plan.name,
      amountUsd,
      billingCycle,
      {
        orderId: orderId,
        organizationId: organizationId,
        planId: plan.id,
        billingCycle: billingCycle,
        email: userEmail
      }
    );

    console.log('Stripe Session Created:', session.id);
    console.log('Checkout URL:', session.url);
    console.log('=== End Stripe Request ===');

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId: orderId,
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Stripe create payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Xác minh Thanh toán Stripe
router.get('/api/payment/stripe/verify', async (req, res) => {
  try {
    const { session_id, order_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing session_id' 
      });
    }

    // Retrieve session from Stripe
    const session = await stripePayment.retrieveSession(session_id);

    console.log('=== Stripe Session Retrieved ===');
    console.log('Session:', session);
    console.log('Payment Status:', session.payment_status);

    // Kiểm tra thanh toán
    const payment = await prisma.payment.findUnique({
      where: { orderId: order_id }
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    // cập nhật trạng thái thanh toán
    if (session.payment_status === 'paid') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          stripePaymentIntentId: session.payment_intent,
          paidAt: new Date(),
          rawResponse: session
        }
      });

      res.json({
        success: true,
        paymentStatus: 'success',
        session: session
      });
    } else {
      res.json({
        success: false,
        paymentStatus: session.payment_status,
        session: session
      });
    }

  } catch (error) {
    console.error('Stripe verify error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;