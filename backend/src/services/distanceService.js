/**
 * Calls Google Maps Distance Matrix API.
 * Returns array of objects with distanceKm and durationMinutes for each destination.
 */
export async function getRealDistances(originLat, originLng, destinations) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GOOGLE_MAPS_API_KEY is missing. Cannot fetch real distances.');
    return null;
  }

  if (destinations.length === 0) return [];

  const origins = `${originLat},${originLng}`;
  const dests = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${dests}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error(`ERROR: Google API returned status ${data.status}`, data.error_message || '');
      return null;
    }

    const row = data.rows[0];
    if (!row || !row.elements) {
      console.error('ERROR: Unexpected API response structure.');
      return null;
    }

    return row.elements.map((element, index) => {
      if (element.status === 'OK') {
        return {
          distanceKm: element.distance.value / 1000,
          durationMinutes: Math.round(element.duration.value / 60)
        };
      } else {
        console.warn(`WARNING: Element status ${element.status} for destination ${destinations[index].name}`);
        return null;
      }
    });

  } catch (err) {
    console.error('ERROR calling Google Distance Matrix API:', err);
    return null;
  }
}
