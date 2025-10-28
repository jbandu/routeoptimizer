/**
 * Sample route data generator for testing 3D visualization
 * This generates realistic flight route waypoints with altitude profiles
 */

/**
 * Generates a sample optimized route with waypoints and altitude data
 * @param {string} originIATA - Origin airport IATA code
 * @param {string} destIATA - Destination airport IATA code
 * @param {object} originAirport - Origin airport data with lat/lon
 * @param {object} destAirport - Destination airport data with lat/lon
 * @returns {object} Optimized route with waypoints
 */
export function generateSampleRoute(originIATA, destIATA, originAirport, destAirport) {
  if (!originAirport || !destAirport) {
    return null;
  }

  const cruiseAltitude = 35000; // Standard cruise altitude in feet
  const numWaypoints = 5; // Number of intermediate waypoints

  // Calculate intermediate points using simple linear interpolation
  const waypoints = [];
  for (let i = 1; i <= numWaypoints; i++) {
    const t = i / (numWaypoints + 1);
    const lat = originAirport.latitude + (destAirport.latitude - originAirport.latitude) * t;
    const lon = originAirport.longitude + (destAirport.longitude - originAirport.longitude) * t;

    // Create a realistic climb/cruise/descent profile
    let altitude;
    if (t < 0.15) {
      // Climb phase (0-15% of route)
      altitude = (t / 0.15) * cruiseAltitude;
    } else if (t > 0.85) {
      // Descent phase (85-100% of route)
      altitude = ((1 - t) / 0.15) * cruiseAltitude;
    } else {
      // Cruise phase
      altitude = cruiseAltitude;
    }

    waypoints.push({
      lat,
      lon,
      altitude: Math.round(altitude),
      name: `WP${i}`,
      type: 'waypoint'
    });
  }

  return {
    origin: {
      lat: originAirport.latitude,
      lon: originAirport.longitude,
      altitude: 0,
      name: originIATA,
      type: 'departure'
    },
    destination: {
      lat: destAirport.latitude,
      lon: destAirport.longitude,
      altitude: 0,
      name: destIATA,
      type: 'arrival'
    },
    waypoints,
    flightLevel: cruiseAltitude
  };
}

/**
 * Generates a sample route between Panama (PTY) and Bogota (BOG)
 * with realistic waypoints for demonstration
 */
export const SAMPLE_PTY_BOG_ROUTE = {
  origin: {
    lat: 9.0714,
    lon: -79.3834,
    altitude: 0,
    name: 'PTY',
    type: 'departure'
  },
  destination: {
    lat: 4.7016,
    lon: -74.1469,
    altitude: 0,
    name: 'BOG',
    type: 'arrival'
  },
  waypoints: [
    { lat: 8.5, lon: -78.5, altitude: 12000, name: 'CLIMB', type: 'waypoint' },
    { lat: 8.0, lon: -77.5, altitude: 28000, name: 'WP1', type: 'waypoint' },
    { lat: 7.0, lon: -76.5, altitude: 35000, name: 'WP2', type: 'waypoint' },
    { lat: 6.0, lon: -75.5, altitude: 35000, name: 'WP3', type: 'waypoint' },
    { lat: 5.3, lon: -74.8, altitude: 18000, name: 'DESCENT', type: 'waypoint' }
  ],
  flightLevel: 35000
};

/**
 * Generates a sample route between Panama (PTY) and Miami (MIA)
 */
export const SAMPLE_PTY_MIA_ROUTE = {
  origin: {
    lat: 9.0714,
    lon: -79.3834,
    altitude: 0,
    name: 'PTY',
    type: 'departure'
  },
  destination: {
    lat: 25.7959,
    lon: -80.2870,
    altitude: 0,
    name: 'MIA',
    type: 'arrival'
  },
  waypoints: [
    { lat: 11.5, lon: -79.5, altitude: 15000, name: 'CLIMB', type: 'waypoint' },
    { lat: 14.0, lon: -79.7, altitude: 32000, name: 'WP1', type: 'waypoint' },
    { lat: 17.5, lon: -80.0, altitude: 37000, name: 'WP2', type: 'waypoint' },
    { lat: 21.0, lon: -80.2, altitude: 37000, name: 'WP3', type: 'waypoint' },
    { lat: 23.8, lon: -80.3, altitude: 20000, name: 'DESCENT', type: 'waypoint' }
  ],
  flightLevel: 37000
};
