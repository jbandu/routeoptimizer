import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY29wYS1haXJsaW5lcyIsImEiOiJjbHhkZW1vIn0.example';

export default function MapView({ routes = [], airports = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-79.3834, 9.0714],
      zoom: 4,
      pitch: 45
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

  useEffect(() => {
    if (!map.current || !mapReady || routes.length === 0) return;

    routes.forEach((route, index) => {
      const origin = airports.find(a => a.iata_code === route.origin_iata);
      const dest = airports.find(a => a.iata_code === route.destination_iata);

      if (origin && dest) {
        const sourceId = `route-${index}`;

        if (map.current.getSource(sourceId)) {
          map.current.removeLayer(sourceId);
          map.current.removeSource(sourceId);
        }

        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [origin.longitude, origin.latitude],
                [dest.longitude, dest.latitude]
              ]
            },
            properties: {
              route: route
            }
          }
        });

        map.current.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#0066CC',
            'line-width': 2,
            'line-opacity': 0.6
          }
        });

        map.current.on('click', sourceId, (e) => {
          setSelectedRoute(route);
        });

        map.current.on('mouseenter', sourceId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', sourceId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      }
    });
  }, [routes, airports, mapReady]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />

      {selectedRoute && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 animate-fade-in">
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

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4">
        <h4 className="font-bold mb-3 text-[#003B7A]">Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FFB81C] border-2 border-white"></div>
            <span>Hub (PTY)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#003B7A] border-2 border-white"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#0066CC]"></div>
            <span>Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
