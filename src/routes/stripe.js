const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { createOrRetrieveCustomer, createSetupIntent } = require('../services/stripe');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/setup-intent', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  console.log('[API] Setup intent request for user:', userId);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('[API] Found user:', user?.email);

    const stripeCustomerId = await createOrRetrieveCustomer(user);
    console.log('[API] Stripe customer ID:', stripeCustomerId);

    const setupIntent = await createSetupIntent(stripeCustomerId);
    console.log('[API] SetupIntent created:', setupIntent.id);

    res.status(200).json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('[API] Error creating setup intent:', error);
    res.status(500).json({ message: 'Stripe setup intent failed', error: error.message });
  }
});
module.exports = router;