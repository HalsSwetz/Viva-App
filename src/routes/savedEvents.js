const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();


router.post('/', verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.userId;

  try {
    const existing = await prisma.savedEvent.findFirst({
      where: { userId, eventId },
    });

    if (existing) {
      return res.status(400).json({ message: 'Event already saved' });
    }

    const saved = await prisma.savedEvent.create({
      data: {
        userId,
        eventId,
      },
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ message: 'Error saving event', error: err.message });
  }
});


router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const savedEvents = await prisma.savedEvent.findMany({
      where: { userId },
      include: {
        event: {
          include: { venue: true },
        },
      },
    });

    res.status(200).json(savedEvents);
  } catch (err) {
    console.error('Error fetching saved events:', err);
    res.status(500).json({ message: 'Error fetching saved events', error: err.message });
  }
});

router.delete('/:eventId', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const { eventId } = req.params;

  try {
    await prisma.savedEvent.deleteMany({
      where: { userId, eventId },
    });

    res.status(200).json({ message: 'Event unsaved successfully' });
  } catch (err) {
    console.error('Error removing saved event:', err);
    res.status(500).json({ message: 'Error removing saved event', error: err.message });
  }
});

module.exports = router;