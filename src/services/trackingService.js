const fetchTracking = async (trackingNumber) => {
  const url = 'https://trackpackagesbatch.p.rapidapi.com/TrackingPackagesV2?needDetails=1';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'trackpackagesbatch.p.rapidapi.com',
      'Content-Type': 'application/json',
      'Authorization': 'Basic Ym9sZGNoYXQ6TGZYfm0zY2d1QzkuKz9SLw==',
    },
    body: JSON.stringify([trackingNumber]),
  });

  if (!response.ok) {
    const err = new Error(`Tracking API error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('No tracking data returned for this number');
  }

  return results[0];
};

const normalizeTracking = (result, trackingNumber) => {
  const events = (result.TrackingDetails ?? []).map((e) => ({
    timestamp: e.EventDateTimeInDateTimeFormat ? new Date(e.EventDateTimeInDateTimeFormat) : null,
    status: (e.Event ?? '').trim(),
    location: (e.EventAddress ?? [e.City, e.State].filter(Boolean).join(', ')).trim(),
    description: (e.Event ?? '').trim(),
  }));

  return {
    provider: 'TrackPackagesBatch / RapidAPI',
    trackingId: trackingNumber,
    carrier: result.Carrier ?? '',
    trackingUrl: null,
    estimatedDelivery: result.ScheduledDeliveryDateInDateTimeFromat ?? result.ScheduledDeliveryDate ?? null,
    events,
  };
};

module.exports = { fetchTracking, normalizeTracking };
