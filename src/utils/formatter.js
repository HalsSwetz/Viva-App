function formatEventData(event) {
    let priceRange = null;
  
    if (event.priceRanges?.[0]) {
      const range = event.priceRanges[0];
      const currency = range.currency || '';
      const min = range.min ? range.min.toFixed(2) : null;
      const max = range.max ? range.max.toFixed(2) : null;
  
      if (min && max && min !== max) {
        priceRange = `${currency} ${min} - ${max}`;
      } else if (min) {
        priceRange = `${currency} ${min}`;
      }
    }
  
    return {
      id: event.id,
      name: event.name,
      date: event.dates?.start?.localDate || null,
      time: event.dates?.start?.localTime || null,
      dateTime: event.dates?.start?.dateTime || null,
      venue: event._embedded?.venues?.[0]?.name || null,
      city: event._embedded?.venues?.[0]?.city?.name || null,
      state: event._embedded?.venues?.[0]?.state?.name || null,
      country: event._embedded?.venues?.[0]?.country?.name || null,
      image: event.images?.[0]?.url || null,
      priceRange: priceRange,
      url: event.url,
      classification: event.classifications?.[0] || null,
    };
  }
  
  module.exports = { formatEventData };