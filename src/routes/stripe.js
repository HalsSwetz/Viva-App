const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { createOrRetrieveCustomer, createSetupIntent } = require('../services/stripe');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/setup-intent', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const stripeCustomerId = await createOrRetrieveCustomer(user);
    const setupIntent = await createSetupIntent(stripeCustomerId);

    res.status(200).json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ message: 'Stripe setup intent failed', error: error.message });
  }
});

module.exports = router;