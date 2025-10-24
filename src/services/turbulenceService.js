import { supabase } from '../lib/supabase';

export async function detectTurbulenceAlongRoute(originLat, originLon, destLat, destLon, cruiseAltitudeFt) {
  try {
    const minLat = Math.min(originLat, destLat) - 1;
    const maxLat = Math.max(originLat, destLat) + 1;
    const minLon = Math.min(originLon, destLon) - 1;
    const maxLon = Math.max(originLon, destLon) + 1;

    const { data, error } = await supabase
      .from('turbulence_data')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLon)
      .lte('longitude', maxLon)
      .gte('altitude_ft', cruiseAltitudeFt - 2000)
      .lte('altitude_ft', cruiseAltitudeFt + 2000)
      .gte('forecast_expires', new Date().toISOString())
      .order('probability', { ascending: false });

    if (error) throw error;

    const turbulenceZones = data.map(zone => ({
      id: zone.id,
      location: {
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude)
      },
      altitude: zone.altitude_ft,
      altitudeRange: zone.altitude_range_ft,
      severity: zone.severity,
      probability: parseFloat(zone.probability),
      radiusNm: zone.area_radius_nm,
      validUntil: zone.forecast_expires,
      dataSource: zone.data_source
    }));

    const hasSevereTurbulence = turbulenceZones.some(z => z.severity === 'SEVERE' && z.probability >= 0.7);
    const hasModerateTurbulence = turbulenceZones.some(z => z.severity === 'MODERATE' && z.probability >= 0.6);

    let recommendation = 'NO_ACTION';
    let message = 'No significant turbulence detected along route';

    if (hasSevereTurbulence) {
      recommendation = 'AVOID';
      message = 'Severe turbulence detected. Route avoidance strongly recommended.';
    } else if (hasModerateTurbulence) {
      recommendation = 'CONSIDER_AVOIDANCE';
      message = 'Moderate turbulence detected. Consider altitude change or route deviation.';
    } else if (turbulenceZones.length > 0) {
      recommendation = 'MONITOR';
      message = 'Light turbulence possible. Safe to proceed with caution.';
    }

    return {
      detected: turbulenceZones.length > 0,
      zones: turbulenceZones,
      recommendation,
      message,
      summary: {
        severe: turbulenceZones.filter(z => z.severity === 'SEVERE').length,
        moderate: turbulenceZones.filter(z => z.severity === 'MODERATE').length,
        light: turbulenceZones.filter(z => z.severity === 'LIGHT').length
      }
    };
  } catch (error) {
    console.error('Error detecting turbulence:', error);
    return {
      detected: false,
      zones: [],
      recommendation: 'NO_ACTION',
      message: 'Unable to fetch turbulence data',
      summary: { severe: 0, moderate: 0, light: 0 }
    };
  }
}

export function estimateDetourCost(turbulenceZone, routeDistanceNm, fuelBurnPerNm) {
  const detourDistanceNm = turbulenceZone.radiusNm * 0.5;
  const additionalFuelGallons = detourDistanceNm * fuelBurnPerNm;
  const additionalTimeMinutes = (detourDistanceNm / 450) * 60;

  return {
    detourDistanceNm: Math.round(detourDistanceNm),
    additionalFuelGallons: Math.round(additionalFuelGallons),
    additionalTimeMinutes: Math.round(additionalTimeMinutes)
  };
}

export function getTurbulenceSeverityColor(severity) {
  switch (severity) {
    case 'SEVERE':
      return '#EF4444';
    case 'MODERATE':
      return '#F59E0B';
    case 'LIGHT':
      return '#FCD34D';
    default:
      return '#9CA3AF';
  }
}

export function getTurbulenceSeverityLevel(severity) {
  switch (severity) {
    case 'SEVERE':
      return 3;
    case 'MODERATE':
      return 2;
    case 'LIGHT':
      return 1;
    default:
      return 0;
  }
}
