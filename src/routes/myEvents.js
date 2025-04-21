const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Simulate a purchase (ticket purchase will later be tied to Stripe & Ticketmaster)
router.post('/', verifyToken, async (req, res) => {
  const { eventId, quantity } = req.body;
  const userId = req.user.userId;

  try {
    // Check if event exists (assumes we're using Ticketmaster's event ID)
    let event = await prisma.event.findUnique({ where: { id: eventId } });

    // If not, you might want to create it using TM data from frontend
    if (!event) {
      return res.status(404).json({ message: 'Event not found in Viva DB' });
    }

    const total = event.price * quantity;

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        eventId,
        quantity,
        total,
      },
    });

    res.status(201).json(purchase);
  } catch (err) {
    console.error('Error creating purchase:', err);
    res.status(500).json({ message: 'Error saving purchase', error: err.message });
  }
});

// Get all events the user has purchased tickets for
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        event: {
          include: { venue: true },
        },
      },
    });

    res.status(200).json(purchases);
  } catch (err) {
    console.error('Error fetching purchased events:', err);
    res.status(500).json({ message: 'Error fetching purchases', error: err.message });
  }
});

module.exports = router;