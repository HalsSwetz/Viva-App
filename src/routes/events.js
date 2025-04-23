const express = require('express');
const { fetchNearbyEvents, fetchFilteredEvents } = require('../services/ticketmaster.js');
const verifyToken = require('../middleware/authMiddleware');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();
const router = express.Router();




router.get('/nearby', verifyToken, async (req, res) => {
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

  router.get('/', async (req, res) => {
    const { query, type } = req.query;
  
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query is required' });
    }
  
    let endpoint = 'events.json'; // default
    if (type === 'artist' || type === 'sportsTeam') {
      endpoint = 'attractions.json';
    } else if (type === 'venue') {
      endpoint = 'venues.json';
    }
  
    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/${endpoint}?apikey=${process.env.TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(query)}&size=5`
      );
  
      const data = await response.json();
  
      const embeddedKey = Object.keys(data._embedded || {})[0];
      const results = embeddedKey ? data._embedded[embeddedKey] : [];
  
      const mapped = results.map((item) => ({
        id: item.id,
        name: item.name,
      }));
  
      res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching from Ticketmaster:', error);
      res.status(500).json({ message: 'Error fetching Ticketmaster data' });
    }
  });
  
  
  module.exports = router;