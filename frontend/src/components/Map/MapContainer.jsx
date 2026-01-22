/**
 * MapContainer - Main map component using React Leaflet
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import { message } from 'antd';
import { landAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * MapBoundsHandler - Fetch lands when map bounds change (with debounce)
 */
function MapBoundsHandler({ onBoundsChange }) {
  const timeoutRef = useRef(null);
  const map = useMapEvents({
    moveend: () => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce: wait 500ms after movement stops
      timeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        onBoundsChange(bounds);
      }, 500);
    },
    zoomend: () => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Zoom ends, load immediately
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    }
  });

  useEffect(() => {
    // Initial load - only once
    const timer = setTimeout(() => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}

/**
 * MapCenterController - Move map to specified center
 */
function MapCenterController({ mapCenter }) {
  const map = useMap();

  useEffect(() => {
    if (mapCenter && mapCenter.lat && mapCenter.lng) {
      map.setView([mapCenter.lat, mapCenter.lng], mapCenter.zoom || 15, {
        animate: true,
        duration: 1
      });
    }
  }, [mapCenter, map]);

  return null;
}

/**
 * SearchFilterController - Reload map when search filters change
 */
function SearchFilterController({ searchFilters, onReload }) {
  const map = useMap();
  const prevFiltersRef = useRef(null);

  useEffect(() => {
    // Only reload if filters actually changed
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(searchFilters);

    if (filtersChanged && map) {
      prevFiltersRef.current = searchFilters;
      const bounds = map.getBounds();
      onReload(bounds);
    }
  }, [searchFilters]); // Only depend on searchFilters, not onReload

  return null;
}

/**
 * Main MapContainer Component
 */
export default function MapContainer({ onLandClick, mapCenter, searchFilters }) {
  const [landData, setLandData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [center] = useState([23.5, 121]); // Taiwan center
  const [zoom] = useState(8);
  const requestInProgressRef = useRef(false); // Track if request is in progress

  /**
   * Handle map bounds change - fetch lands in view
   */
  const handleBoundsChange = useCallback(async (bounds) => {
    // Skip if a request is already in progress
    if (requestInProgressRef.current) {
      return;
    }

    const { _southWest, _northEast } = bounds;

    try {
      requestInProgressRef.current = true;
      setLoading(true);

      // When search filters are active, increase limit to ensure we get matching lands
      const bboxLimit = searchFilters ? 2000 : 500;

      const geoJson = await landAPI.getByBbox(
        _southWest.lng,
        _southWest.lat,
        _northEast.lng,
        _northEast.lat,
        bboxLimit
      );

      // Apply search filters if they exist
      if (searchFilters && geoJson.features) {
        const filteredFeatures = geoJson.features.filter(feature => {
          const props = feature.properties;

          // Check city filter
          if (searchFilters.city && props.city !== searchFilters.city) {
            return false;
          }

          // Check district filter
          if (searchFilters.district && props.district !== searchFilters.district) {
            return false;
          }

          // Check parcel_no filter (partial match)
          if (searchFilters.parcel_no && props.parcel_no &&
              !props.parcel_no.includes(searchFilters.parcel_no)) {
            return false;
          }

          // Check owner_name filter (partial match)
          if (searchFilters.owner_name && props.owner_name &&
              !props.owner_name.includes(searchFilters.owner_name)) {
            return false;
          }

          return true;
        });

        setLandData({
          ...geoJson,
          features: filteredFeatures
        });
      } else {
        setLandData(geoJson);
      }
    } catch (error) {
      message.error('載入地圖資料失敗');
      console.error('Failed to load land data:', error);
    } finally {
      setLoading(false);
      requestInProgressRef.current = false;
    }
  }, [searchFilters]); // Only re-create when searchFilters change

  /**
   * Style for land polygons - Professional color scheme
   */
  const getPolygonStyle = (feature) => {
    return {
      fillColor: '#0369A1',      // Trust blue from design system
      weight: 1.5,
      opacity: 0.9,
      color: '#0F172A',          // Professional dark border
      fillOpacity: 0.35
    };
  };

  /**
   * Handle polygon click
   */
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onLandClick && feature.properties) {
          onLandClick(feature.properties);
        }
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.6,
          weight: 2.5,
          color: '#0369A1',      // Accent blue on hover
          fillColor: '#0284C7'   // Brighter blue on hover
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getPolygonStyle(feature));
      }
    });

    // Bind popup
    if (feature.properties) {
      const { city, district, section_name, parcel_no, area } = feature.properties;
      layer.bindPopup(`
        <div style="font-size: 12px;">
          <strong>${city} ${district}</strong><br/>
          ${section_name || ''} ${parcel_no || ''}<br/>
          面積: ${area ? area.toFixed(2) : '-'} m²
        </div>
      `);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LeafletMap
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Land Polygons Layer */}
        {landData && landData.features && (
          <GeoJSON
            key={JSON.stringify(landData)}
            data={landData}
            style={getPolygonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Bounds Change Handler */}
        <MapBoundsHandler onBoundsChange={handleBoundsChange} />

        {/* Map Center Controller */}
        <MapCenterController mapCenter={mapCenter} />

        {/* Search Filter Controller */}
        <SearchFilterController searchFilters={searchFilters} onReload={handleBoundsChange} />
      </LeafletMap>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-indicator">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="8" cy="8" r="6" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="9 30" />
          </svg>
          載入中...
        </div>
      )}

      {/* Search Filter Indicator */}
      {searchFilters && (
        <div className="filter-badge">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'text-bottom' }}>
            <path fillRule="evenodd" d="M8 4a.5.5 0 01.5.5V6a.5.5 0 01-1 0V4.5A.5.5 0 018 4zM3.732 5.732a.5.5 0 01.707 0l.915.914a.5.5 0 11-.708.708l-.914-.915a.5.5 0 010-.707zM2 10a.5.5 0 01.5-.5h1.586a.5.5 0 010 1H2.5A.5.5 0 012 10zm9.5 0a.5.5 0 01.5-.5h1.5a.5.5 0 010 1H12a.5.5 0 01-.5-.5zm.754-4.246a.389.389 0 00-.527-.02L7.547 9.31a.91.91 0 101.302 1.258l3.434-4.297a.389.389 0 00-.029-.518z"/>
          </svg>
          {searchFilters.city && `${searchFilters.city}`}
          {searchFilters.district && ` ${searchFilters.district}`}
          {searchFilters.parcel_no && ` · 地號:${searchFilters.parcel_no}`}
          {searchFilters.owner_name && ` · ${searchFilters.owner_name}`}
        </div>
      )}
    </div>
  );
}
