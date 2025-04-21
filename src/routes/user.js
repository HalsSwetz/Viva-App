const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { PrismaClient } = require('../../generated/prisma');
const { createOrRetrieveCustomer, createSetupIntent } = require('../services/stripe');

const prisma = new PrismaClient();
const router = express.Router();


router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { preferences: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      zipCode: user.zipCode,
      dateOfBirth: user.dateOfBirth,
      stripeCustomerId: user.stripeCustomerId,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});


router.patch('/update-profile', verifyToken, async (req, res) => {
  const { name, email, phoneNumber, address, zipCode, dateOfBirth } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        name,
        email,
        phoneNumber,
        address,
        zipCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});


router.get('/update-payment', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const stripeCustomerId = await createOrRetrieveCustomer(user);
    const setupIntent = await createSetupIntent(stripeCustomerId);

    res.status(200).json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error generating setup intent:', error);
    res.status(500).json({ message: 'Failed to initiate payment update', error: error.message });
  }
});

module.exports = router;