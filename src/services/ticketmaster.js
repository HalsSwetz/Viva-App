const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

const fetchNearbyEvents = async (lat, lng, radius = 50) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        latlong: `${lat},${lng}`,
        radius,
        unit: 'miles',
      },
    });
    return response.data._embedded?.events || [];
} catch (error) {
    console.error('Error fetching events from Ticketmaster:', error.message);
    throw new Error('Failed to fetch events');
  }
};

const fetchFilteredEvents = async ({
    lat,
    lng,
    radius = 50,
    category,
    keyword,
    date,
    page = 0,
    size = 20,
    sort = 'date,asc'
  }) => {
    try {
      const params = {
        apikey: API_KEY,
        latlong: `${lat},${lng}`,
        radius,
        unit: 'miles',
        page,
        size,
        sort,
      };
  
      if (category) params.classificationName = category;
      if (keyword) params.keyword = keyword;
      if (date) params.startDateTime = date;
      
      if (type === 'venue') params.venueId = keyword;
      if (type === 'artist') params.keyword = keyword;
      if (type === 'genre') params.classificationName = keyword;
  

      const response = await axios.get(BASE_URL, { params });
      return response.data._embedded?.events || [];
    } catch (error) {
      console.error('Error fetching filtered events from Ticketmaster:');
      logAxiosError(error);
      throw new Error('Failed to fetch filtered events');
    }
  };

const logAxiosError = (error) => {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  };

module.exports = { 
    fetchNearbyEvents,
    fetchFilteredEvents,
};