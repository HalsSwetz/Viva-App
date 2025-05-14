const express = require('express');
const { fetchNearbyEvents, fetchFilteredEvents } = require('../services/ticketmaster.js');
const verifyToken = require('../middleware/authMiddleware');
const { PrismaClient } = require('../../generated/prisma');
const zipcodes = require('zipcodes');
const axios = require('axios');

const { formatEventData } = require('../utils/formatter');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/nearby', verifyToken, async (req, res) => {
  const { lat, lng, radius, category, keyword, date, page, size, sort, type } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    let events;

    if (category || keyword || date || page || size || sort || type) {
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
        type,
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
  const { query, types } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ message: 'Query is required' });
  }

  const typeArray = types ? types.split(',') : ['event'];

  try {
    const results = [];
    for (const type of typeArray) {
      let endpoint = 'events.json';
      if (type === 'artist' || type === 'sportsTeam') {
        endpoint = 'attractions.json';
      } else if (type === 'venue') {
        endpoint = 'venues.json';
      }

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/${endpoint}?apikey=${process.env.TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(query)}&size=5`
      );

      const data = await response.json();
      const embeddedKey = Object.keys(data._embedded || {})[0];
      const items = embeddedKey ? data._embedded[embeddedKey] : [];

      const mapped = items.map((item) => ({
        id: item.id,
        name: item.name,
        type: type,
      }));

      results.push(...mapped);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching from Ticketmaster:', error);
    res.status(500).json({ message: 'Error fetching Ticketmaster data' });
  }
});

router.get('/feed', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const preferences = await prisma.userPreference.findMany({ where: { userId } });

    let query = {
      apikey: process.env.TICKETMASTER_API_KEY,
      radius: req.query.radius || 50,
      unit: 'miles',
      size: 40,
      sort: 'date,asc',
    };
    
    if (preferences.length > 0) {
      const grouped = preferences.reduce((acc, pref) => {
        if (!pref.tmId || !pref.type) return acc;
        if (!acc[pref.type]) acc[pref.type] = [];
        acc[pref.type].push(pref.tmId);
        return acc;
      }, {});
    
      if (grouped.artist && grouped.artist.length > 0) {
        query.attractionId = grouped.artist.join(',');
      } else if (grouped.genre && grouped.genre.length > 0) {
        query.classificationId = grouped.genre.join(',');
      } else if (grouped.venue && grouped.venue.length > 0) {
        query.venueId = grouped.venue.join(',');
      } else if (grouped.city && grouped.city.length > 0) {
        query.city = grouped.city.join(',');
      }
    
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { zipCode: true },
      });
    
      if (!user?.zipCode) {
        return res.status(400).json({ message: 'No preferences or zip code available' });
      }
    
      const location = zipcodes.lookup(user.zipCode);
      if (!location) {
        return res.status(400).json({ message: 'Invalid zip code' });
      }
      const { latitude, longitude } = location;
      query.latlong = `${latitude},${longitude}`;
    }

    console.log('[Backend] Query params to Ticketmaster:', query);

    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params: query,
    });

    const events = response.data._embedded?.events || [];

    const formattedEvents = events.map(formatEventData);

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error('Error in /api/events/feed:', error.message);
    res.status(500).json({ message: 'Failed to fetch personalized feed', error: error.message });
  }
});

module.exports = router;