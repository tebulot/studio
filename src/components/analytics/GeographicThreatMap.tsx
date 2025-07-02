'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, Shield } from 'lucide-react';

// Dynamic import for Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface GeographicData {
  country: string;
  sessions?: number;
  requests?: number; // For backwards compatibility
  latitude?: number;
  longitude?: number;
}

interface GeographicThreatMapProps {
  data: GeographicData[];
}

// Country coordinates for mapping (using capital cities as reference points)
// Supporting both country codes and full names
const COUNTRY_COORDINATES: { [key: string]: [number, number] } = {
  // Country codes (from API)
  'US': [39.0458, -76.6413],
  'CN': [39.9042, 116.4074],
  'RU': [55.7558, 37.6176],
  'DE': [52.5200, 13.4050],
  'BR': [-15.8267, -47.9218],
  'GB': [51.5074, -0.1278],
  'FR': [48.8566, 2.3522],
  'IN': [28.6139, 77.2090],
  'JP': [35.6762, 139.6503],
  'CA': [45.4215, -75.6972],
  'AU': [-35.2809, 149.1300],
  'KR': [37.5665, 126.9780],
  'NL': [52.3676, 4.9041],
  'IT': [41.9028, 12.4964],
  'ES': [40.4168, -3.7038],
  'MX': [19.4326, -99.1332],
  'TR': [39.9334, 32.8597],
  'PL': [52.2297, 21.0122],
  'UA': [50.4501, 30.5234],
  'IR': [35.6892, 51.3890],
  'IL': [31.7683, 35.2137],
  'VN': [21.0285, 105.8542],
  'TH': [13.7563, 100.5018],
  'SE': [59.3293, 18.0686],
  'NO': [59.9139, 10.7522],
  'FI': [60.1699, 24.9384],
  'BE': [50.8503, 4.3517],
  'CH': [46.9480, 7.4474],
  'AT': [48.2082, 16.3738],
  'CZ': [50.0755, 14.4378],
  'PT': [38.7223, -9.1393],
  'RO': [44.4268, 26.1025],
  'HU': [47.4979, 19.0402],
  'GR': [37.9755, 23.7348],
  'SG': [1.3521, 103.8198],
  'HK': [22.3193, 114.1694],
  'TW': [25.0330, 121.5654],
  'MY': [3.1390, 101.6869],
  'ID': [-6.2088, 106.8456],
  'PH': [14.5995, 120.9842],
  'ZA': [-25.7461, 28.1881],
  'EG': [30.0444, 31.2357],
  'NG': [9.0765, 7.3986],
  'MA': [34.0209, -6.8416],
  'KE': [-1.2921, 36.8219],
  'AR': [-34.6118, -58.3960],
  'CL': [-33.4489, -70.6693],
  'CO': [4.7110, -74.0721],
  'PE': [-12.0464, -77.0428],
  'VE': [10.4806, -66.9036],
  
  // Full country names (fallback compatibility)
  'United States': [39.0458, -76.6413],
  'China': [39.9042, 116.4074],
  'Russia': [55.7558, 37.6176],
  'Germany': [52.5200, 13.4050],
  'Brazil': [-15.8267, -47.9218],
  'United Kingdom': [51.5074, -0.1278],
  'France': [48.8566, 2.3522],
  'India': [28.6139, 77.2090],
  'Japan': [35.6762, 139.6503],
  'Canada': [45.4215, -75.6972],
  'Australia': [-35.2809, 149.1300],
  'South Korea': [37.5665, 126.9780],
  'Netherlands': [52.3676, 4.9041],
  'Italy': [41.9028, 12.4964],
  'Spain': [40.4168, -3.7038],
  'Mexico': [19.4326, -99.1332],
  'Turkey': [39.9334, 32.8597],
  'Poland': [52.2297, 21.0122],
  'Ukraine': [50.4501, 30.5234],
  'Iran': [35.6892, 51.3890],
  'Israel': [31.7683, 35.2137],
  'Vietnam': [21.0285, 105.8542],
  'Thailand': [13.7563, 100.5018],
  'Sweden': [59.3293, 18.0686],
  'Norway': [59.9139, 10.7522],
  'Finland': [60.1699, 24.9384],
  'Belgium': [50.8503, 4.3517],
  'Switzerland': [46.9480, 7.4474],
  'Austria': [48.2082, 16.3738],
  'Czech Republic': [50.0755, 14.4378],
  'Portugal': [38.7223, -9.1393],
  'Romania': [44.4268, 26.1025],
  'Hungary': [47.4979, 19.0402],
  'Greece': [37.9755, 23.7348],
  'Singapore': [1.3521, 103.8198],
  'Hong Kong': [22.3193, 114.1694],
  'Taiwan': [25.0330, 121.5654],
  'Malaysia': [3.1390, 101.6869],
  'Indonesia': [-6.2088, 106.8456],
  'Philippines': [14.5995, 120.9842],
  'South Africa': [-25.7461, 28.1881],
  'Egypt': [30.0444, 31.2357],
  'Nigeria': [9.0765, 7.3986],
  'Morocco': [34.0209, -6.8416],
  'Kenya': [-1.2921, 36.8219],
  'Argentina': [-34.6118, -58.3960],
  'Chile': [-33.4489, -70.6693],
  'Colombia': [4.7110, -74.0721],
  'Peru': [-12.0464, -77.0428],
  'Venezuela': [10.4806, -66.9036]
};

function LeafletMap({ data }: GeographicThreatMapProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Import Leaflet CSS dynamically
    import('leaflet/dist/leaflet.css');
    
    // Fix default markers
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading threat map...</p>
        </div>
      </div>
    );
  }

  // Prepare map data with coordinates
  const mapData = data
    .map(item => ({
      ...item,
      coordinates: COUNTRY_COORDINATES[item.country] || null
    }))
    .filter(item => {
      if (item.coordinates === null) {
        console.log(`No coordinates found for country: ${item.country}`);
        return false;
      }
      return true;
    });

  console.log('Geographic data for map:', mapData);

  // Calculate threat intensity for circle sizing and coloring
  const maxRequests = Math.max(...mapData.map(item => item.sessions || item.requests || 0), 1);
  
  // Get threat intensity level
  const getThreatIntensity = (requests: number) => {
    const intensity = requests / maxRequests;
    if (intensity > 0.7) return 'high';
    if (intensity > 0.3) return 'medium';
    return 'low';
  };

  // SpiteSpiral brand colors for threat levels
  const getThreatColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'hsl(0 84.2% 60.2%)'; // Destructive red
      case 'medium': return 'hsl(0 0% 30%)'; // Dark gray  
      case 'low': return 'hsl(0 0% 50%)'; // Medium gray
      default: return 'hsl(0 0% 13%)'; // Primary charcoal
    }
  };

  const getCircleRadius = (requests: number) => {
    const intensity = requests / maxRequests;
    return Math.max(4, intensity * 20); // Minimum 4px, maximum 20px
  };

  return (
    <div className="w-full h-[400px] border border-border rounded-lg overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: 'hsl(var(--muted))' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* SpiteSpiral styled tile layer - using a muted, professional style */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          opacity={0.8}
        />
        
        {/* Threat markers */}
        {mapData.map((threat, index) => {
          const requestCount = threat.sessions || threat.requests || 0;
          const intensity = getThreatIntensity(requestCount);
          const color = getThreatColor(intensity);
          const radius = getCircleRadius(requestCount);
          
          return (
            <CircleMarker
              key={`${threat.country}-${index}`}
              center={threat.coordinates as [number, number]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.7,
                color: 'hsl(var(--primary))', // Dark charcoal border
                weight: 2,
                opacity: 0.9
              }}
            >
              <Popup>
                <div className="text-sm font-mono">
                  <div className="font-semibold text-primary mb-1">{threat.country}</div>
                  <div className="text-xs text-muted-foreground">
                    <div>Sessions: <span className="font-medium text-foreground">{requestCount.toLocaleString()}</span></div>
                    <div>Threat Level: <span className={`font-medium ${
                      intensity === 'high' ? 'text-destructive' : 
                      intensity === 'medium' ? 'text-orange-600' : 
                      'text-muted-foreground'
                    }`}>{intensity.toUpperCase()}</span></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function GeographicThreatMap({ data }: GeographicThreatMapProps) {
  // Calculate statistics
  const totalCountries = data.length;
  const totalRequests = data.reduce((sum, item) => sum + (item.sessions || item.requests || 0), 0);
  const topThreat = data.reduce((max, item) => 
    (item.sessions || item.requests || 0) > (max.sessions || max.requests || 0) ? item : max, 
    data[0] || { country: 'N/A', sessions: 0 });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Global Threat Distribution
            </CardTitle>
            <CardDescription>
              Real-time geographic analysis of tarpit interactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalCountries} Countries
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {totalRequests.toLocaleString()} Requests
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map */}
          <LeafletMap data={data} />
          
          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Threat Intensity Legend</h4>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 84.2% 60.2%)' }}></div>
                  <span className="text-muted-foreground">High Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 0% 30%)' }}></div>
                  <span className="text-muted-foreground">Medium Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 0% 50%)' }}></div>
                  <span className="text-muted-foreground">Low Activity</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Top Threat Source</h4>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{topThreat.country}</span> - {(topThreat.sessions || topThreat.requests || 0).toLocaleString()} sessions
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}