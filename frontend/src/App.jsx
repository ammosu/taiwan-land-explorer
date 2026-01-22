/**
 * Main Application Component
 */
import { useState, useEffect } from 'react';
import { Layout, Typography, message } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapContainer from './components/Map/MapContainer';
import SearchBar from './components/Search/SearchBar';
import LandDetails from './components/Sidebar/LandDetails';
import { statsAPI } from './services/api';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [selectedLand, setSelectedLand] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  // 使用預設統計資料避免慢速 API 調用
  const [stats] = useState({
    total_lands: 381344, // 固定值，避免載入時呼叫慢速 API
    total_area: 762680401.21,
    cities_count: 22,
    districts_count: 334
  });
  const [mapCenter, setMapCenter] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null); // Store current search filters

  // 移除統計資料自動載入以提升初始載入速度
  // 統計資料改為使用固定值（資料更新頻率低）

  // Handle land click from map
  const handleLandClick = (landData) => {
    setSelectedLand(landData);
    setDrawerVisible(true);
  };

  // Handle search results
  const handleSearchResults = async (results, filters) => {
    setSearchResults(results);
    setSearchFilters(filters); // Store search filters
    if (results.length > 0) {
      // Get first result's detail with geometry
      try {
        const { landAPI } = await import('./services/api');
        const firstResult = await landAPI.getById(results[0].id);

        if (firstResult.geometry && firstResult.geometry.coordinates) {
          // Calculate center of polygon
          const coords = firstResult.geometry.coordinates[0];
          const lngs = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

          setMapCenter({ lat: centerLat, lng: centerLng, zoom: 13 });
        }
      } catch (error) {
        console.error('Failed to get land details:', error);
      }
    }
  };

  // Handle clicking on search result
  const handleSearchResultClick = async (result) => {
    try {
      const { landAPI } = await import('./services/api');
      const detailData = await landAPI.getById(result.id);
      setSelectedLand(detailData);
      setDrawerVisible(true);

      // Also move map to this location
      if (detailData.geometry && detailData.geometry.coordinates) {
        const coords = detailData.geometry.coordinates[0];
        const lngs = coords.map(c => c[0]);
        const lats = coords.map(c => c[1]);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

        setMapCenter({ lat: centerLat, lng: centerLng, zoom: 16 });
      }
    } catch (error) {
      message.error('載入土地詳細資訊失敗');
      console.error('Failed to load land details:', error);
    }
  };

  // Close drawer
  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="24" height="24" rx="4" fill="#0369A1"/>
            <path d="M12 12h8v8h-8v-8z" fill="white" opacity="0.6"/>
            <path d="M8 8h4v4H8V8zM20 8h4v4h-4V8zM8 20h4v4H8v-4zM20 20h4v4h-4v-4z" fill="white"/>
          </svg>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            台灣國有土地資料視覺化系統
          </Title>
        </div>
        <div>
          {stats && (
            <span className="header-stats">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.7">
                <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"/>
              </svg>
              <Text style={{ color: 'white', fontWeight: 500 }}>
                共 {stats.total_lands.toLocaleString()} 筆資料
              </Text>
            </span>
          )}
        </div>
      </Header>

      {/* Main Content */}
      <Layout>
        <Content>
          {/* Search Bar */}
          <SearchBar onSearchResults={handleSearchResults} />

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div className="search-results-card">
              <div className="search-results-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'text-bottom' }}>
                  <path fillRule="evenodd" d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
                </svg>
                搜尋結果：找到 {searchResults.length} 筆資料（點擊查看詳情）
              </div>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSearchResultClick(result)}
                  className="search-result-item"
                >
                  <div className="search-result-title">
                    {result.city} {result.district} - {result.section_name || ''} {result.parcel_no}
                  </div>
                  <div className="search-result-meta">
                    面積: {result.area ? parseFloat(result.area).toFixed(2) : '-'} m² •
                    公告現值: {result.announced_value ? result.announced_value.toLocaleString() : '-'} 元/m²
                    {result.owner_name && ` • 所有權人: ${result.owner_name}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Map */}
          <div className="map-wrapper" style={{
            height: searchResults.length > 0 ? 'calc(100vh - 420px)' : 'calc(100vh - 220px)'
          }}>
            <MapContainer
              onLandClick={handleLandClick}
              mapCenter={mapCenter}
              searchFilters={searchFilters}
            />
          </div>
        </Content>
      </Layout>

      {/* Land Details Drawer */}
      <LandDetails
        land={selectedLand}
        visible={drawerVisible}
        onClose={handleDrawerClose}
      />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
