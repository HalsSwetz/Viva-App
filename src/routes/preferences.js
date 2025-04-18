const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const verifyToken = require('../middleware/authMiddleware'); // adjust if your path differs

const router = express.Router();
const prisma = new PrismaClient();

router.patch('/update-preferences', verifyToken, async (req, res) => {
  const { preferences } = req.body;
  const userId = req.user.userId;

  try {
    await prisma.userPreference.deleteMany({ where: { userId } }); // Clear old prefs

    const newPrefs = preferences.map(pref => ({
      userId,
      type: pref.type,
      value: pref.value,
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

module.exports = router;