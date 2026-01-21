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
  const [stats, setStats] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null); // Store current search filters

  // Load statistics on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsAPI.getSummary();
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

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
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            台灣國有土地資料視覺化系統
          </Title>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)' }}>
          {stats && (
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              共 {stats.total_lands.toLocaleString()} 筆土地資料
            </Text>
          )}
        </div>
      </Header>

      {/* Main Content */}
      <Layout>
        <Content style={{ padding: '16px' }}>
          {/* Search Bar */}
          <SearchBar onSearchResults={handleSearchResults} />

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              marginBottom: 16,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{
                padding: '8px 16px',
                background: '#fafafa',
                borderBottom: '1px solid #d9d9d9',
                fontWeight: 'bold'
              }}>
                搜尋結果：找到 {searchResults.length} 筆資料（點擊查看詳情）
              </div>
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleSearchResultClick(result)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {result.city} {result.district} - {result.section_name || ''} {result.parcel_no}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    面積: {result.area ? parseFloat(result.area).toFixed(2) : '-'} m² |
                    公告現值: {result.announced_value ? result.announced_value.toLocaleString() : '-'} 元/m²
                    {result.owner_name && ` | 所有權人: ${result.owner_name}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Map */}
          <div style={{
            height: searchResults.length > 0 ? 'calc(100vh - 420px)' : 'calc(100vh - 220px)',
            background: 'white',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
