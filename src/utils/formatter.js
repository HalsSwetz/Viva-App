function formatEventData(event) {
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
      priceRange: formatPrice(event.priceRanges?.[0]) || 'Free',
      url: event.url,
      classification: event.classifications?.[0] || null,
    };
  }
  
  function formatPrice(priceObj) {
    if (!priceObj) return null;
  
    const min = priceObj.min;
    const max = priceObj.max;
    const currency = priceObj.currency || 'USD';
  
    if (min != null && max != null) {
      return min === max
        ? `${currency} ${min.toFixed(2)}`
        : `${currency} ${min.toFixed(2)} - ${max.toFixed(2)}`;
    } else if (min != null) {
      return `${currency} ${min.toFixed(2)}+`;
    } else if (max != null) {
      return `Up to ${currency} ${max.toFixed(2)}`;
    }
  
    return null;
  }
  
  module.exports = { formatEventData };