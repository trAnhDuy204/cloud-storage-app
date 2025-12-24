// Helper function tạo, cập nhật subscription
const prisma = require('../lib/prisma');

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

module.exports = {
  createOrUpdateSubscription
};