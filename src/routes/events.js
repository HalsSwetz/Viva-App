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
        type: type || 'event',
      }));
  
      res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching from Ticketmaster:', error);
      res.status(500).json({ message: 'Error fetching Ticketmaster data' });
    }
  });


  router.get('/feed', verifyToken, async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const preferences = await prisma.userPreference.findMany({
        where: { userId },
      });
  
      if (!preferences || preferences.length === 0) {
        return res.status(200).json([]); // No preferences, return empty list
      }
  
      // Group preferences by type
      const grouped = preferences.reduce((acc, pref) => {
        const { type, tmId } = pref;
        if (!tmId) return acc; // skip if no tmId
  
        if (!acc[type]) acc[type] = [];
        acc[type].push(tmId);
        return acc;
      }, {});
  
      // Build query params
      const query = {
        latlong: req.query.lat && req.query.lng ? `${req.query.lat},${req.query.lng}` : undefined,
        radius: req.query.radius || 50,
        unit: 'miles',
        sort: 'date,asc',
        size: 30,
        apikey: process.env.TICKETMASTER_API_KEY,
      };
  
      if (grouped.artist) query.attractionId = grouped.artist.join(',');
      if (grouped.venue) query.venueId = grouped.venue.join(',');
      if (grouped.genre) query.classificationId = grouped.genre.join(',');
      if (grouped.city) query.city = grouped.city.join(',');
  
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: query,
      });
  
      const events = response.data._embedded?.events || [];
  
      res.status(200).json(events);
    } catch (error) {
      console.error('Error in /api/events/feed:', error);
      res.status(500).json({ message: 'Failed to fetch personalized events' });
    }
  });
  
  
  module.exports = router;