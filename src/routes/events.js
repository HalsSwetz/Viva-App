const express = require('express');
const { fetchNearbyEvents, fetchFilteredEvents } = require('../services/ticketmaster.js');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/events/nearby', verifyToken, async (req, res) => {
    const { lat, lng, radius, category, keyword, date, page, size, sort } = req.query;
  
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
  
    try {
      let events;

      if (category || keyword || date || page || size || sort) {
        events = await fetchFilteredEvents({
          lat,
          lng,
          radius,
          category,
          keyword,
          date,
          page,
          size,
          sort,
        });
      } else {
        events = await fetchNearbyEvents(lat, lng, radius);
      }
  
      res.status(200).json(events);
    } catch (error) {
      console.error('Error in /events/nearby route:', error.message);
      res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
  });
  
  module.exports = router;