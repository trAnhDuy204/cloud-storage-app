const Stripe = require('stripe');

class StripePayment {
  constructor(secretKey) {
    this.stripe = Stripe(secretKey);
  }

  async createCheckoutSession(orderId, planName, amountUsd, billingCycle, metadata = {}) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${planName} Plan - ${billingCycle}`,
                description: `Cloud Storage ${planName} Plan`,
              },
              unit_amount: Math.round(amountUsd * 100), // Cents
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${process.env.STRIPE_CANCEL_URL}?order_id=${orderId}`,
        metadata: {
          orderId: orderId,
          ...metadata
        },
        customer_email: metadata.email || undefined,
      });

      return session;
    } catch (error) {
      console.error('Stripe create session error:', error);
      throw error;
    }
  }

  async retrieveSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Stripe retrieve session error:', error);
      throw error;
    }
  }

  async createPaymentIntent(amountUsd, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amountUsd * 100),
        currency: currency,
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Stripe create payment intent error:', error);
      throw error;
    }
  }

  constructWebhookEvent(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }
}

module.exports = StripePayment;