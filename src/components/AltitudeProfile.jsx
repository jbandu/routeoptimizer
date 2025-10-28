import React from 'react';

/**
 * AltitudeProfile component displays a visual altitude profile for a flight route
 * showing waypoints and altitude changes along the path
 */
export default function AltitudeProfile({ waypoints = [], cruiseAltitude = 35000 }) {
  if (!waypoints || waypoints.length === 0) {
    return null;
  }

  const maxAltitude = Math.max(cruiseAltitude, ...waypoints.map(wp => wp.altitude || 0));
  const heightScale = maxAltitude > 0 ? 100 / maxAltitude : 0;

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-black/90 p-4 rounded-lg shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white text-sm font-bold">Altitude Profile</h3>
        <div className="text-xs text-gray-400">
          Cruise: {cruiseAltitude.toLocaleString()} ft
        </div>
      </div>

      <svg
        width="100%"
        height="120"
        viewBox="0 0 1000 120"
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="1000" height="120" fill="url(#grid)" />

        {/* Altitude reference lines */}
        <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="5,5" />
        <text x="5" y="98" fill="#888" fontSize="10">0 ft</text>

        <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="5,5" />
        <text x="5" y="48" fill="#888" fontSize="10">{Math.round(maxAltitude / 2).toLocaleString()} ft</text>

        <line x1="0" y1="10" x2="1000" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="5,5" />
        <text x="5" y="8" fill="#888" fontSize="10">{maxAltitude.toLocaleString()} ft</text>

        {/* Flight path area fill */}
        <defs>
          <linearGradient id="altitudeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#0096ff', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#0096ff', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>

        {waypoints.length > 1 && (
          <polygon
            points={
              waypoints.map((wp, i) => {
                const x = (i / (waypoints.length - 1)) * 1000;
                const altitude = wp.altitude || 0;
                const y = 100 - (altitude * heightScale);
                return `${x},${y}`;
              }).join(' ') +
              ` 1000,100 0,100`
            }
            fill="url(#altitudeGradient)"
          />
        )}

        {/* Flight path line */}
        {waypoints.length > 1 && (
          <polyline
            points={waypoints.map((wp, i) => {
              const x = (i / (waypoints.length - 1)) * 1000;
              const altitude = wp.altitude || 0;
              const y = 100 - (altitude * heightScale);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#0096ff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Waypoint markers and labels */}
        {waypoints.map((wp, i) => {
          const x = (i / (waypoints.length - 1)) * 1000;
          const altitude = wp.altitude || 0;
          const y = 100 - (altitude * heightScale);
          const isStart = i === 0;
          const isEnd = i === waypoints.length - 1;
          const color = isStart ? '#0f0' : isEnd ? '#f00' : '#ff0';

          return (
            <g key={i}>
              {/* Waypoint marker */}
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              />

              {/* Waypoint name */}
              <text
                x={x}
                y="118"
                fill="white"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                className="drop-shadow-lg"
              >
                {wp.name}
              </text>

              {/* Altitude label (only show for key waypoints) */}
              {(isStart || isEnd || i % Math.ceil(waypoints.length / 5) === 0) && (
                <text
                  x={x}
                  y={y - 10}
                  fill="#0096ff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="drop-shadow-lg"
                >
                  {Math.round(altitude).toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
          <span className="text-gray-300">Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
          <span className="text-gray-300">Waypoint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
          <span className="text-gray-300">Destination</span>
        </div>
      </div>
    </div>
  );
}
