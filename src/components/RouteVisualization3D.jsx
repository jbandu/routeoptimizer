import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer, ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';
import AltitudeProfile from './AltitudeProfile';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY29wYS1haXJsaW5lcyIsImEiOiJjbHhkZW1vIn0.example';

/**
 * RouteVisualization3D component provides an enhanced 3D visualization of flight routes
 * with altitude profiles, waypoints, and interactive controls
 */
export default function RouteVisualization3D({ routes = [], airports = [], optimizedRoute = null, onViewChange = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const deckOverlay = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [show3D, setShow3D] = useState(true);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-79.3834, 9.0714], // COPA hub in Panama
      zoom: 4,
      pitch: show3D ? 60 : 0, // 3D viewing angle
      bearing: 0,
      projection: 'globe',
      antialias: true
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update pitch when 3D mode changes
  useEffect(() => {
    if (map.current && mapReady) {
      map.current.easeTo({
        pitch: show3D ? 60 : 0,
        duration: 1000
      });
    }
  }, [show3D, mapReady]);

  // Add airport markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    airports.forEach(airport => {
      const isHub = airport.iata_code === 'PTY';

      const el = document.createElement('div');
      el.className = 'airport-marker';
      el.style.width = isHub ? '20px' : '12px';
      el.style.height = isHub ? '20px' : '12px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = isHub ? '#FFB81C' : '#003B7A';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      new mapboxgl.Marker(el)
        .setLngLat([airport.longitude, airport.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; font-family: Inter, sans-serif;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${airport.iata_code} - ${airport.city}</h3>
                <p style="font-size: 12px; margin: 0;">${airport.name}</p>
                <p style="font-size: 10px; color: #666; margin-top: 4px;">${airport.country}</p>
              </div>
            `)
        )
        .addTo(map.current);
    });
  }, [airports, mapReady]);

  // Update Deck.gl layers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const layers = [];

    // Add route arcs for overview
    if (routes.length > 0 && show3D) {
      const routeArcs = routes
        .filter(route => {
          const origin = airports.find(a => a.iata_code === route.origin_iata);
          const dest = airports.find(a => a.iata_code === route.destination_iata);
          return origin && dest;
        })
        .map(route => {
          const origin = airports.find(a => a.iata_code === route.origin_iata);
          const dest = airports.find(a => a.iata_code === route.destination_iata);
          return {
            source: [origin.longitude, origin.latitude],
            target: [dest.longitude, dest.latitude],
            route: route
          };
        });

      layers.push(
        new ArcLayer({
          id: 'route-arcs',
          data: routeArcs,
          getSourcePosition: d => d.source,
          getTargetPosition: d => d.target,
          getSourceColor: [0, 102, 204, 150],
          getTargetColor: [0, 150, 255, 150],
          getWidth: 2,
          getHeight: 0.3,
          opacity: 0.6,
          pickable: true,
          onClick: info => {
            if (info.object) {
              setSelectedRoute(info.object.route);
            }
          }
        })
      );
    }

    // Add optimized route with waypoints if available
    if (optimizedRoute && show3D) {
      const waypoints = [
        {
          position: [optimizedRoute.origin.lon, optimizedRoute.origin.lat, optimizedRoute.origin.altitude || 0],
          name: optimizedRoute.origin.name,
          type: 'departure'
        },
        ...(optimizedRoute.waypoints || []).map(wp => ({
          position: [wp.lon, wp.lat, wp.altitude],
          name: wp.name,
          type: 'waypoint'
        })),
        {
          position: [optimizedRoute.destination.lon, optimizedRoute.destination.lat, optimizedRoute.destination.altitude || 0],
          name: optimizedRoute.destination.name,
          type: 'arrival'
        }
      ];

      // 3D Flight Path
      layers.push(
        new PathLayer({
          id: 'flight-path-3d',
          data: [{ path: waypoints.map(wp => wp.position) }],
          getPath: d => d.path,
          getColor: [0, 150, 255, 255],
          getWidth: 5,
          widthMinPixels: 3,
          widthScale: 20,
          opacity: 0.9,
          pickable: true,
          extruded: true,
          billboard: false,
          capRounded: true,
          jointRounded: true
        })
      );

      // Waypoint markers
      layers.push(
        new ScatterplotLayer({
          id: 'waypoints',
          data: waypoints,
          getPosition: d => d.position,
          getFillColor: d =>
            d.type === 'departure' ? [0, 255, 0, 255] :
            d.type === 'arrival' ? [255, 0, 0, 255] :
            [255, 255, 0, 255],
          getRadius: 3000,
          radiusMinPixels: 6,
          radiusMaxPixels: 30,
          pickable: true,
          opacity: 1,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          getLineColor: [255, 255, 255],
          onHover: info => {
            if (info.object && map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            } else if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          }
        })
      );
    }

    // Create or update deck overlay
    if (deckOverlay.current) {
      deckOverlay.current.setProps({ layers });
    } else {
      deckOverlay.current = new MapboxOverlay({ layers });
      map.current.addControl(deckOverlay.current);
    }

    // Fit bounds if we have an optimized route
    if (optimizedRoute && mapReady) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([optimizedRoute.origin.lon, optimizedRoute.origin.lat]);
      bounds.extend([optimizedRoute.destination.lon, optimizedRoute.destination.lat]);
      (optimizedRoute.waypoints || []).forEach(wp => {
        bounds.extend([wp.lon, wp.lat]);
      });
      map.current.fitBounds(bounds, { padding: 100, duration: 2000 });
    }
  }, [routes, airports, optimizedRoute, mapReady, show3D]);

  // Prepare waypoints for altitude profile
  const altitudeWaypoints = optimizedRoute ? [
    {
      name: optimizedRoute.origin.name,
      altitude: optimizedRoute.origin.altitude || 0,
      type: 'departure'
    },
    ...(optimizedRoute.waypoints || []).map(wp => ({
      name: wp.name,
      altitude: wp.altitude,
      type: 'waypoint'
    })),
    {
      name: optimizedRoute.destination.name,
      altitude: optimizedRoute.destination.altitude || 0,
      type: 'arrival'
    }
  ] : [];

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl p-3 flex flex-col gap-2 z-10">
        {/* 3D Toggle */}
        <button
          onClick={() => setShow3D(!show3D)}
          className="flex items-center gap-2 hover:bg-gray-50 transition-colors px-2 py-1 rounded"
        >
          <span className="font-semibold text-sm">{show3D ? '3D View' : '2D View'}</span>
          <div className={`w-10 h-6 rounded-full transition-colors ${show3D ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${show3D ? 'translate-x-4' : ''}`}></div>
          </div>
        </button>

        {/* Back to Classic View Button */}
        {onViewChange && (
          <button
            onClick={onViewChange}
            className="flex items-center gap-2 px-3 py-2 bg-[#003B7A] text-white rounded hover:bg-[#0066CC] transition-colors text-sm font-semibold"
          >
            Back to Classic View
          </button>
        )}
      </div>

      {/* Selected Route Info Panel */}
      {selectedRoute && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 animate-fade-in z-10">
          <button
            onClick={() => setSelectedRoute(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <h3 className="font-bold text-lg mb-3 text-[#003B7A]">
            {selectedRoute.origin_iata} → {selectedRoute.destination_iata}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold">{selectedRoute.distance_nm} nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flight Time:</span>
              <span className="font-semibold">{selectedRoute.flight_time_hours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aircraft:</span>
              <span className="font-semibold">{selectedRoute.typical_aircraft_iata}</span>
            </div>
          </div>
        </div>
      )}

      {/* Altitude Profile */}
      {optimizedRoute && altitudeWaypoints.length > 0 && show3D && (
        <AltitudeProfile
          waypoints={altitudeWaypoints}
          cruiseAltitude={optimizedRoute.flightLevel || 35000}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-10">
        <h4 className="font-bold mb-3 text-[#003B7A]">Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FFB81C] border-2 border-white"></div>
            <span>Hub (PTY)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#003B7A] border-2 border-white"></div>
            <span>Airport</span>
          </div>
          {show3D && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                <span>Origin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
                <span>Waypoint</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                <span>Destination</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#0096ff]"></div>
            <span>Flight Path</span>
          </div>
        </div>
      </div>
    </div>
  );
}
