const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const verifyToken = require('../middleware/authMiddleware'); 

const router = express.Router();
const prisma = new PrismaClient();

router.patch('/update-preferences', verifyToken, async (req, res) => {
  const { preferences } = req.body; 
  const userId = req.user.userId;

  try {
    const tmIdsToRemove = preferences.filter(pref => pref.remove).map(pref => pref.tmId);
    if (tmIdsToRemove.length > 0) {
      await prisma.userPreference.deleteMany({
        where: {
          userId,
          tmId: { in: tmIdsToRemove }
        }
      });
    }
    const newPrefs = preferences.filter(pref => !pref.remove).map(pref => ({
      userId,
      type: pref.type,
      value: pref.value,
      tmId: pref.tmId, 
    }));

    await prisma.userPreference.createMany({
      data: newPrefs,
      skipDuplicates: true,
    });

    res.status(200).json({ message: 'Preferences updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating preferences', error: err.message });
  }
});

router.get('/preferences', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
    });

    res.status(200).json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences', error: error.message });
  }
});

module.exports = router;