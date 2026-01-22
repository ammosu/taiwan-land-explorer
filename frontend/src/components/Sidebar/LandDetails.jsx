/**
 * LandDetails - Display detailed information for selected land
 */
import { Drawer, Descriptions, Typography, Divider, Empty } from 'antd';
import { EnvironmentOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LandDetails({ land, visible, onClose }) {
  if (!land) {
    return (
      <Drawer
        title="土地詳細資訊"
        placement="right"
        width={400}
        onClose={onClose}
        open={visible}
      >
        <Empty description="請點選地圖上的土地以查看詳細資訊" />
      </Drawer>
    );
  }

  // Format number with commas
  const formatNumber = (num) => {
    if (num == null) return '-';
    return num.toLocaleString('zh-TW');
  };

  // Format area
  const formatArea = (area) => {
    if (!area) return '-';
    const sqMeters = parseFloat(area);
    const ping = sqMeters * 0.3025; // 1坪 = 3.3058m²
    return `${sqMeters.toFixed(2)} m² (約 ${ping.toFixed(2)} 坪)`;
  };

  return (
    <Drawer
      title="土地詳細資訊"
      placement="right"
      width={450}
      onClose={onClose}
      open={visible}
    >
      {/* Location Section */}
      <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
        </svg>
        位置資訊
      </Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="縣市">{land.city || '-'}</Descriptions.Item>
        <Descriptions.Item label="鄉鎮市區">{land.district || '-'}</Descriptions.Item>
        <Descriptions.Item label="段小段">{land.section_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="地號">{land.parcel_no || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Land Info Section */}
      <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/>
        </svg>
        土地資訊
      </Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="登記面積">
          {formatArea(land.area)}
        </Descriptions.Item>
        <Descriptions.Item label="使用分區">
          {land.land_use_zone || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="使用地類別">
          {land.land_use_type || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Price Section */}
      <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
        </svg>
        價值資訊
      </Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="公告現值">
          {land.announced_value
            ? `${formatNumber(land.announced_value)} 元/m²`
            : '-'
          }
        </Descriptions.Item>
        <Descriptions.Item label="公告地價">
          {land.announced_land_price
            ? `${formatNumber(land.announced_land_price)} 元/m²`
            : '-'
          }
        </Descriptions.Item>
        <Descriptions.Item label="申報地價">
          {land.declared_land_price
            ? `${formatNumber(land.declared_land_price)} 元/m²`
            : '-'
          }
        </Descriptions.Item>
      </Descriptions>

      {/* Calculate total value if area and price available */}
      {land.area && land.announced_value && (
        <div className="value-card">
          <Text strong style={{ color: 'var(--color-secondary)' }}>估算總價值（公告現值）</Text>
          <br />
          <Text className="value-amount">
            {formatNumber(Math.round(land.area * land.announced_value))} 元
          </Text>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {formatArea(land.area)} × {formatNumber(land.announced_value)} 元/m²
          </div>
        </div>
      )}

      <Divider />

      {/* Owner Section */}
      <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
        所有權資訊
      </Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="所有權人">
          {land.owner_name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="統一編號">
          {land.owner_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="所有權人類別">
          {land.owner_type || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="權利範圍">
          {land.right_range_type || '-'}
          {land.right_numerator && land.right_denominator &&
            ` (${land.right_numerator}/${land.right_denominator})`
          }
        </Descriptions.Item>
        <Descriptions.Item label="管理者">
          {land.manager_name || '-'}
        </Descriptions.Item>
      </Descriptions>

      {/* ID for reference */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
        ID: {land.id}
      </div>
    </Drawer>
  );
}
