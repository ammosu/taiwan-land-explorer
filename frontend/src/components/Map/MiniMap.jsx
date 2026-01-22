/**
 * MiniMap - 迷你地圖組件，顯示選中土地及周邊區域
 */
import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { message } from 'antd';
import { landAPI } from '../../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ land }) {
  const [nearbyLands, setNearbyLands] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * 計算 polygon 的中心點和邊界
   */
  const mapSettings = useMemo(() => {
    if (!land || !land.geometry || !land.geometry.coordinates) {
      return { center: [23.5, 121], zoom: 8, bounds: null };
    }

    try {
      // GeoJSON Polygon 格式: coordinates[0] 是外環座標數組
      const coords = land.geometry.coordinates[0];

      // 計算邊界
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);

      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // 計算中心點
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      // 計算擴展邊界（顯示周邊區域）
      const lngPadding = (maxLng - minLng) * 1.5; // 150% 擴展
      const latPadding = (maxLat - minLat) * 1.5;

      const expandedBounds = {
        minLng: minLng - lngPadding / 2,
        maxLng: maxLng + lngPadding / 2,
        minLat: minLat - latPadding / 2,
        maxLat: maxLat + latPadding / 2
      };

      return {
        center: [centerLat, centerLng],
        zoom: 16, // 較高的 zoom level 顯示詳細資訊
        bounds: expandedBounds
      };
    } catch (error) {
      console.error('Failed to calculate map settings:', error);
      return { center: [23.5, 121], zoom: 8, bounds: null };
    }
  }, [land]);

  /**
   * 載入周邊土地資料
   */
  useEffect(() => {
    const loadNearbyLands = async () => {
      if (!mapSettings.bounds) return;

      try {
        setLoading(true);
        const { minLng, minLat, maxLng, maxLat } = mapSettings.bounds;

        // 載入周邊區域的土地（限制 100 筆避免過載）
        const geoJson = await landAPI.getByBbox(minLng, minLat, maxLng, maxLat, 100);

        // 過濾掉當前選中的土地（避免重複顯示）
        if (geoJson.features && land.id) {
          geoJson.features = geoJson.features.filter(
            feature => feature.properties.id !== land.id
          );
        }

        setNearbyLands(geoJson);
      } catch (error) {
        console.error('Failed to load nearby lands:', error);
        // 不顯示錯誤訊息，只是不載入周邊土地
      } finally {
        setLoading(false);
      }
    };

    loadNearbyLands();
  }, [mapSettings.bounds, land.id]);

  /**
   * 選中土地的樣式（高亮顯示）
   */
  const selectedLandStyle = {
    fillColor: '#F59E0B',     // 琥珀色（警示色）
    weight: 3,
    opacity: 1,
    color: '#D97706',         // 深琥珀色邊框
    fillOpacity: 0.6
  };

  /**
   * 周邊土地的樣式（淡化顯示）
   */
  const nearbyLandStyle = {
    fillColor: '#0369A1',     // 藍色
    weight: 1,
    opacity: 0.5,
    color: '#0F172A',
    fillOpacity: 0.2
  };

  /**
   * 為選中的土地建立 GeoJSON 物件
   */
  const selectedLandGeoJson = useMemo(() => {
    if (!land || !land.geometry) return null;

    return {
      type: 'Feature',
      geometry: land.geometry,
      properties: land
    };
  }, [land]);

  /**
   * 綁定 popup 和 tooltip
   */
  const onEachFeature = (feature, layer) => {
    const props = feature.properties;

    // Tooltip (hover 顯示)
    if (props.parcel_no) {
      layer.bindTooltip(
        `${props.city || ''} ${props.district || ''}<br/>${props.section_name || ''} ${props.parcel_no}`,
        { sticky: true }
      );
    }
  };

  if (!land || !land.geometry) {
    return (
      <div style={{
        height: '250px',
        background: 'var(--color-hover)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem'
      }}>
        無地理資訊
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
      {/* 地圖標題 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-sm)',
        paddingBottom: 'var(--space-sm)',
        borderBottom: '2px solid var(--color-border)'
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}>
          地理位置
        </span>
        {loading && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginLeft: 'auto'
          }}>
            載入周邊資料...
          </span>
        )}
      </div>

      {/* 迷你地圖 */}
      <div style={{
        height: '280px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '2px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative'
      }}>
        <MapContainer
          center={mapSettings.center}
          zoom={mapSettings.zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={false} // 防止意外滾動
          dragging={true}
          doubleClickZoom={true}
        >
          {/* 地圖圖層 */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 周邊土地（背景層）*/}
          {nearbyLands && nearbyLands.features && (
            <GeoJSON
              key={`nearby-${land.id}`}
              data={nearbyLands}
              style={nearbyLandStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* 選中的土地（前景層，高亮）*/}
          {selectedLandGeoJson && (
            <GeoJSON
              key={`selected-${land.id}`}
              data={selectedLandGeoJson}
              style={selectedLandStyle}
              onEachFeature={(feature, layer) => {
                // 綁定 popup 顯示詳細資訊
                layer.bindPopup(`
                  <div style="font-family: var(--font-body); font-size: 0.875rem;">
                    <strong style="color: var(--color-primary);">選中的土地</strong><br/>
                    ${feature.properties.city || ''} ${feature.properties.district || ''}<br/>
                    ${feature.properties.section_name || ''} ${feature.properties.parcel_no || ''}<br/>
                    面積: ${feature.properties.area ? parseFloat(feature.properties.area).toFixed(2) : '-'} m²
                  </div>
                `);
              }}
            />
          )}
        </MapContainer>

        {/* 圖例 */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: 'var(--space-sm)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.75rem',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{
              width: '16px',
              height: '12px',
              background: '#F59E0B',
              border: '2px solid #D97706',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: 'var(--color-text)' }}>選中宗地</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '16px',
              height: '12px',
              background: 'rgba(3, 105, 161, 0.2)',
              border: '1px solid rgba(15, 23, 42, 0.5)',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: 'var(--color-text)' }}>鄰近宗地</span>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <div style={{
        marginTop: 'var(--space-sm)',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        textAlign: 'center'
      }}>
        可拖曳地圖查看周邊區域 · 點擊宗地查看資訊
      </div>
    </div>
  );
}
