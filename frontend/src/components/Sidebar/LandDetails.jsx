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
      <Title level={5}>
        <EnvironmentOutlined /> 位置資訊
      </Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="縣市">{land.city || '-'}</Descriptions.Item>
        <Descriptions.Item label="鄉鎮市區">{land.district || '-'}</Descriptions.Item>
        <Descriptions.Item label="段小段">{land.section_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="地號">{land.parcel_no || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Land Info Section */}
      <Title level={5}>土地資訊</Title>
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
      <Title level={5}>
        <DollarOutlined /> 價值資訊
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
        <div style={{
          marginTop: 12,
          padding: 12,
          background: '#f0f5ff',
          borderRadius: 4
        }}>
          <Text strong>估算總價值（公告現值）：</Text>
          <br />
          <Text style={{ fontSize: 18, color: '#1890ff' }}>
            {formatNumber(Math.round(land.area * land.announced_value))} 元
          </Text>
        </div>
      )}

      <Divider />

      {/* Owner Section */}
      <Title level={5}>
        <UserOutlined /> 所有權資訊
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
