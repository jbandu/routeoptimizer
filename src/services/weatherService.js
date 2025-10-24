import { supabase } from '../lib/supabase';

export const weatherService = {
  async getWindData(originLat, originLon, destLat, destLon, altitudes = [35000, 37000, 39000, 41000]) {
    const latMin = Math.min(originLat, destLat) - 1;
    const latMax = Math.max(originLat, destLat) + 1;
    const lonMin = Math.min(originLon, destLon) - 1;
    const lonMax = Math.max(originLon, destLon) + 1;

    const { data, error } = await supabase
      .from('wind_data')
      .select('*')
      .gte('latitude', latMin)
      .lte('latitude', latMax)
      .gte('longitude', lonMin)
      .lte('longitude', lonMax)
      .in('altitude_ft', altitudes)
      .gte('forecast_valid_time', new Date().toISOString())
      .order('forecast_valid_time', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  calculateGreatCircleWaypoints(originLat, originLon, destLat, destLon, numWaypoints = 5) {
    const waypoints = [];

    for (let i = 0; i <= numWaypoints; i++) {
      const fraction = i / numWaypoints;

      const lat1 = (originLat * Math.PI) / 180;
      const lon1 = (originLon * Math.PI) / 180;
      const lat2 = (destLat * Math.PI) / 180;
      const lon2 = (destLon * Math.PI) / 180;

      const d = Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
      );

      const a = Math.sin((1 - fraction) * d) / Math.sin(d);
      const b = Math.sin(fraction * d) / Math.sin(d);

      const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
      const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
      const z = a * Math.sin(lat1) + b * Math.sin(lat2);

      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lon = Math.atan2(y, x);

      waypoints.push({
        latitude: (lat * 180) / Math.PI,
        longitude: (lon * 180) / Math.PI,
        index: i
      });
    }

    return waypoints;
  },

  interpolateWindAtWaypoint(waypoint, windData, altitude) {
    const relevantWinds = windData.filter(w => w.altitude_ft === altitude);

    if (relevantWinds.length === 0) {
      return {
        wind_speed_knots: 0,
        wind_direction_degrees: 0,
        temperature_celsius: -50
      };
    }

    let closestWind = relevantWinds[0];
    let minDistance = this.calculateDistance(
      waypoint.latitude,
      waypoint.longitude,
      closestWind.latitude,
      closestWind.longitude
    );

    for (const wind of relevantWinds) {
      const distance = this.calculateDistance(
        waypoint.latitude,
        waypoint.longitude,
        wind.latitude,
        wind.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestWind = wind;
      }
    }

    return {
      wind_speed_knots: closestWind.wind_speed_knots,
      wind_direction_degrees: closestWind.wind_direction_degrees,
      temperature_celsius: closestWind.temperature_celsius
    };
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440.065;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  calculateWindComponent(windSpeed, windDirection, courseDirection) {
    const windAngle = ((windDirection - courseDirection + 180) * Math.PI) / 180;
    const headwindComponent = windSpeed * Math.cos(windAngle);
    const crosswindComponent = windSpeed * Math.sin(windAngle);

    return {
      headwind: -headwindComponent,
      crosswind: crosswindComponent,
      tailwind: headwindComponent
    };
  },

  calculateCourseDirection(lat1, lon1, lat2, lon2) {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
  },

  async analyzeRouteWinds(originAirport, destAirport) {
    const waypoints = this.calculateGreatCircleWaypoints(
      originAirport.latitude,
      originAirport.longitude,
      destAirport.latitude,
      destAirport.longitude,
      5
    );

    const windData = await this.getWindData(
      originAirport.latitude,
      originAirport.longitude,
      destAirport.latitude,
      destAirport.longitude
    );

    const courseDirection = this.calculateCourseDirection(
      originAirport.latitude,
      originAirport.longitude,
      destAirport.latitude,
      destAirport.longitude
    );

    const altitudes = [35000, 37000, 39000, 41000];
    const altitudeAnalysis = [];

    for (const altitude of altitudes) {
      let totalTailwind = 0;
      let waypointCount = 0;

      for (const waypoint of waypoints) {
        const wind = this.interpolateWindAtWaypoint(waypoint, windData, altitude);
        const component = this.calculateWindComponent(
          wind.wind_speed_knots,
          wind.wind_direction_degrees,
          courseDirection
        );
        totalTailwind += component.tailwind;
        waypointCount++;
      }

      const avgTailwind = totalTailwind / waypointCount;

      altitudeAnalysis.push({
        altitude_ft: altitude,
        avg_tailwind_knots: avgTailwind,
        avg_headwind_knots: -avgTailwind
      });
    }

    altitudeAnalysis.sort((a, b) => b.avg_tailwind_knots - a.avg_tailwind_knots);

    const optimalAltitude = altitudeAnalysis[0];
    const baselineAltitude = altitudeAnalysis.find(a => a.altitude_ft === 37000) || altitudeAnalysis[1];

    const distance = this.calculateDistance(
      originAirport.latitude,
      originAirport.longitude,
      destAirport.latitude,
      destAirport.longitude
    );

    const cruiseSpeed = 450;
    const windAdvantage = optimalAltitude.avg_tailwind_knots - baselineAltitude.avg_tailwind_knots;
    const timeSavingsHours = (distance / (cruiseSpeed + baselineAltitude.avg_tailwind_knots)) -
                              (distance / (cruiseSpeed + optimalAltitude.avg_tailwind_knots));
    const timeSavingsMinutes = timeSavingsHours * 60;

    return {
      waypoints,
      windData,
      courseDirection,
      altitudeAnalysis,
      optimalAltitude: optimalAltitude.altitude_ft,
      avgTailwind: optimalAltitude.avg_tailwind_knots,
      timeSavingsMinutes: Math.max(0, timeSavingsMinutes),
      windAdvantageKnots: windAdvantage
    };
  }
};
