// frontend/src/components/MapContainer.jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fixing the "Missing Marker" bug in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// NOTICE THE CHANGE HERE: { places = [], center }
export default function MapView({ places = [], center }) {
  return (
    // Add a check to ensure center exists before rendering MapContainer to prevent other crashes
    center ? (
      <MapContainer key={center.toString()} center={center} zoom={13} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* The ?. prevents the crash if places is somehow still null */}
        {places?.map((p, i) => (
          <Marker key={i} position={[p.geometry.coordinates[1], p.geometry.coordinates[0]]}>
            <Popup>
              <strong>{p.properties.name || "Unknown Shop"}</strong><br/>
              {p.properties.address_line2}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    ) : <div>Loading Map...</div>
  );
}