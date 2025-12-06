const express = require('express');
const router = express.Router();
const VNPay = require('../utils/vnpay');
const prisma = require('../lib/prisma');

// Khởi tạo VNPay
const vnpay = new VNPay({
  vnp_TmnCode: process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
  vnp_Url: process.env.VNPAY_URL,
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL
});

// Tạo payment 
router.post('/api/payment/vnpay/create', async (req, res) => {
  try {
    const { planId, billingCycle, organizationId } = req.body;
    
    console.log('=== VNPay Payment Request ===');
    console.log('Body:', req.body);
    
    if (!planId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: planId or organizationId' 
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

    //Số tiền phải >= 10,000 VND
    if (amountVnd < 10000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be at least 10,000 VND' 
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

    // Lưu payment vào DB
    const payment = await prisma.payment.create({
      data: {
        organizationId: organizationId,
        planId: planId,
        orderId: orderId,
        paymentMethod: 'vnpay',
        amountUsd: amountUsd,
        amountVnd: BigInt(amountVnd),
        currency: 'VND',
        status: 'pending',
        description: orderInfo,
        ipAddress: ipAddr,
        returnUrl: process.env.VNPAY_RETURN_URL
      }
    });

    // Tạo payment URL
    const paymentUrl = vnpay.createPaymentUrl(
      orderId,
      amountVnd,
      orderInfo,
      ipAddr
    );

    console.log('=== Payment URL created ===');
    console.log(paymentUrl);
    console.log('=== End VNPay Request ===');

    res.status(201).json({
      success: true,
      paymentUrl: paymentUrl,
      orderId: orderId,
      paymentId: payment.id
    });

  } catch (error) {
    console.error('VNPay create payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// VNPay return URL
router.get('/api/payment/vnpay/return', async (req, res) => {
  try {
    const vnp_Params = req.query;

    const isValid = vnpay.verifyReturnUrl(vnp_Params);

    if (!isValid) {
      return res.redirect('http://localhost:3000/payment/failure?reason=invalid_signature');
    }

    const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    const orderId = vnp_Params['vnp_TxnRef'];
    const vnpayTransactionId = vnp_Params['vnp_TransactionNo'];
    const amount = vnp_Params['vnp_Amount'] / 100;

    // Tìm payment trong database
    const payment = await prisma.payment.findUnique({
      where: { orderId: orderId }
    });

    if (!payment) {
      return res.redirect('http://localhost:3000/payment/failure?reason=payment_not_found');
    }

    if (vnp_ResponseCode === '00') {
      // Thanh toán thành công
      
      // Cập nhật payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          vnpayTransactionId: vnpayTransactionId,
          vnpayResponseCode: vnp_ResponseCode,
          paidAt: new Date(),
          rawResponse: vnp_Params
        }
      });

      console.log('VNPay Payment updated to success');

      if (payment.planId) {
        await createOrUpdateSubscription(payment.organizationId, planId, {
          id: vnpayTransactionId,
          payment_intent: vnpayTransactionId
        });
      }

      console.log('Payment success:', orderId);
      return res.redirect(`http://localhost:3000/payment/success?orderId=${orderId}&amount=${amount}`);
      
    } else {
      // Thanh toán thất bại
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          vnpayResponseCode: vnp_ResponseCode,
          rawResponse: vnp_Params
        }
      });

      console.log('Payment failed:', vnp_ResponseCode);
      return res.redirect(`http://localhost:3000/payment/failure?code=${vnp_ResponseCode}&orderId=${orderId}`);
    }

  } catch (error) {
    console.error('VNPay return error:', error);
    res.redirect('http://localhost:3000/payment/failure?reason=error');
  }
});

// VNPay IPN URL
router.get('/api/payment/vnpay/ipn', async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    const isValid = vnpay.verifyReturnUrl(vnp_Params);
    
    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    const orderId = vnp_Params['vnp_TxnRef'];
    const vnpayTransactionId = vnp_Params['vnp_TransactionNo'];

    const payment = await prisma.payment.findUnique({
      where: { orderId: orderId }
    });

    if (!payment) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (vnp_ResponseCode === '00') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          vnpayTransactionId: vnpayTransactionId,
          vnpayResponseCode: vnp_ResponseCode,
          paidAt: new Date(),
          rawResponse: vnp_Params
        }
      });

      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          vnpayResponseCode: vnp_ResponseCode,
          rawResponse: vnp_Params
        }
      });

      return res.status(200).json({ RspCode: '00', Message: 'Payment failed recorded' });
    }

  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(200).json({ RspCode: '99', Message: 'Error' });
  }
});

// lấy lịch sử giao dịch
router.get('/api/payments/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { organizationId: organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      payments: payments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
