const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get all plans
router.get('/api/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        priceUsd: 'asc'
      }
    });
    
    res.json({ 
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get single plan
router.get('/api/plans/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!plan) {
      return res.status(404).json({ 
        success: false,
        error: 'Plan not found' 
      });
    }
    
    res.json({ 
      success: true,
      plan: plan
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;