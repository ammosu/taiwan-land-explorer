/**
 * SearchBar - Search interface for lands
 */
import { useState, useEffect } from 'react';
import { Input, Select, Button, Form, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchAPI } from '../../services/api';

const { Option } = Select;

export default function SearchBar({ onSearchResults }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  // Load cities on mount
  useEffect(() => {
    loadCities();
  }, []);

  // Load cities list
  const loadCities = async () => {
    try {
      const data = await searchAPI.getCities();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  // Load districts when city changes
  const handleCityChange = async (city) => {
    setSelectedCity(city);
    form.setFieldsValue({ district: undefined }); // Reset district

    if (city) {
      try {
        const data = await searchAPI.getDistricts(city);
        setDistricts(data);
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    } else {
      setDistricts([]);
    }
  };

  // Handle search
  const handleSearch = async (values) => {
    try {
      setLoading(true);

      // Build search params
      const params = {};
      if (values.city) params.city = values.city;
      if (values.district) params.district = values.district;
      if (values.parcel_no) params.parcel_no = values.parcel_no;
      if (values.owner_name) params.owner_name = values.owner_name;

      // Dynamic limit based on search criteria
      // More specific search = higher limit
      if (values.district) {
        params.limit = 5000; // District level: show all (most districts < 5000)
      } else if (values.city) {
        params.limit = 2000; // City level: show more
      } else if (values.parcel_no || values.owner_name) {
        params.limit = 1000; // Specific search: moderate limit
      } else {
        params.limit = 100; // No filter: keep it small
      }

      const results = await searchAPI.search(params);

      if (results.length === 0) {
        message.info('沒有找到符合的土地資料');
      } else if (results.length >= params.limit) {
        message.warning(`找到 ${results.length} 筆資料（已達上限，可能有更多）`);
      } else {
        message.success(`找到 ${results.length} 筆資料`);
      }

      if (onSearchResults) {
        // Pass both results and search params
        onSearchResults(results, params);
      }
    } catch (error) {
      message.error('搜尋失敗');
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    form.resetFields();
    setSelectedCity(null);
    setDistricts([]);
    if (onSearchResults) {
      onSearchResults([], null); // Clear results and filters
    }
  };

  return (
    <div style={{ padding: '16px', background: 'white', borderRadius: 8, marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
      >
        <Space wrap style={{ width: '100%' }} size="small">
          <Form.Item name="city" label="縣市" style={{ marginBottom: 0 }}>
            <Select
              placeholder="選擇縣市"
              style={{ width: 120 }}
              onChange={handleCityChange}
              allowClear
              showSearch
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="district" label="鄉鎮市區" style={{ marginBottom: 0 }}>
            <Select
              placeholder="選擇鄉鎮市區"
              style={{ width: 120 }}
              disabled={!selectedCity}
              allowClear
              showSearch
            >
              {districts.map(district => (
                <Option key={district} value={district}>{district}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="parcel_no" label="地號" style={{ marginBottom: 0 }}>
            <Input placeholder="輸入地號" style={{ width: 150 }} />
          </Form.Item>

          <Form.Item name="owner_name" label="所有權人" style={{ marginBottom: 0 }}>
            <Input placeholder="輸入所有權人" style={{ width: 150 }} />
          </Form.Item>

          <Form.Item label=" " style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
              >
                搜尋
              </Button>
              <Button onClick={handleReset}>
                清除
              </Button>
            </Space>
          </Form.Item>
        </Space>
      </Form>
    </div>
  );
}
