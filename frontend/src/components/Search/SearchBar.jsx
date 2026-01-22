/**
 * SearchBar - Search interface for lands
 */
import { useState, useEffect } from 'react';
import { Input, Select, Button, Form, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchAPI } from '../../services/api';

const { Option } = Select;

// 台灣縣市清單（固定資料，不需要 API 查詢）
const TAIWAN_CITIES = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
  '基隆市', '新竹市', '嘉義市',
  '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
  '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
];

// 台灣各縣市鄉鎮區清單（固定資料，368 個鄉鎮區）
const TAIWAN_DISTRICTS = {
  '臺北市': ["中山區", "信義區", "內湖區", "北投區", "南港區", "士林區", "大同區", "大安區", "文山區", "萬華區"],
  '新北市': ["三峽區", "三芝區", "三重區", "中和區", "五股區", "八里區", "土城區", "坪林區", "平溪區", "新店區", "新莊區", "板橋區", "林口區", "樹林區", "永和區", "汐止區", "泰山區", "淡水區", "深坑區", "烏來區", "瑞芳區", "石碇區", "石門區", "萬里區", "蘆洲區", "貢寮區", "金山區", "雙溪區", "鶯歌區"],
  '桃園市': ["中壢區", "八德區", "大園區", "大溪區", "平鎮區", "復興區", "新屋區", "桃園區", "楊梅區", "蘆竹區", "觀音區", "龍潭區", "龜山區"],
  '臺中市': ["北區", "北屯區", "南屯區", "后里區", "和平區", "外埔區", "大安區", "大甲區", "大肚區", "大里區", "大雅區", "太平區", "新社區", "東勢區", "東區", "梧棲區", "沙鹿區", "清水區", "潭子區", "烏日區", "石岡區", "神岡區", "西區", "西屯區", "豐原區", "霧峰區", "龍井區"],
  '臺南市': ["七股區", "下營區", "中西區", "仁德區", "佳里區", "六甲區", "北區", "北門區", "南化區", "南區", "善化區", "大內區", "學甲區", "安南區", "安定區", "安平區", "官田區", "將軍區", "山上區", "後壁區", "新化區", "新市區", "新營區", "東區", "東山區", "柳營區", "楠西區", "歸仁區", "永康區", "玉井區", "白河區", "西港區", "關廟區", "鹽水區", "麻豆區"],
  '高雄市': ["三民區", "仁武區", "內門區", "六龜區", "前金區", "前鎮區", "大寮區", "大樹區", "大社區", "小港區", "岡山區", "左營區", "彌陀區", "新興區", "旗山區", "旗津區", "杉林區", "林園區", "桃源區", "梓官區", "楠梓區", "橋頭區", "永安區", "湖內區", "燕巢區", "田寮區", "甲仙區", "美濃區", "苓雅區", "茄萣區", "路竹區", "阿蓮區", "鳥松區", "鳳山區", "鼓山區"],
  '基隆市': ["七堵區", "中山區", "中正區", "信義區", "安樂區", "暖暖區"],
  '新竹市': ["新竹市"],
  '嘉義市': ["嘉義市"],
  '新竹縣': ["北埔鄉", "寶山鄉", "峨眉鄉", "新埔鎮", "新豐鄉", "橫山鄉", "湖口鄉", "竹北市", "竹東鎮", "芎林鄉", "關西鎮"],
  '苗栗縣': ["三灣鄉", "三義鄉", "公館鄉", "卓蘭鎮", "南庄鄉", "大湖鄉", "後龍鎮", "泰安鄉", "獅潭鄉", "竹南鎮", "苑裡鎮", "苗栗市", "西湖鄉", "通霄鎮", "造橋鄉", "銅鑼鄉", "頭份巿", "頭屋鄉"],
  '彰化縣': ["二林鎮", "二水鄉", "伸港鄉", "北斗鎮", "和美鎮", "員林市", "埔心鄉", "埔鹽鄉", "埤頭鄉", "大城鄉", "大村鄉", "彰化市", "永靖鄉", "溪州鄉", "溪湖鎮", "田中鎮", "田尾鄉", "社頭鄉", "福興鄉", "秀水鄉", "竹塘鄉", "芬園鄉", "花壇鄉", "芳苑鄉", "鹿港鎮"],
  '南投縣': ["中寮鄉", "仁愛鄉", "南投市", "名間鄉", "國姓鄉", "埔里鎮", "水里鄉", "竹山鎮", "草屯鎮", "集集鎮", "魚池鄉", "鹿谷鄉"],
  '雲林縣': ["二崙鄉", "元長鄉", "北港鎮", "口湖鄉", "古坑鄉", "台西鄉", "四湖鄉", "土庫鎮", "大埤鄉", "崙背鄉", "斗六市", "斗南鎮", "東勢鄉", "林內鄉", "水林鄉", "莿桐鄉", "虎尾鎮", "西螺鎮", "麥寮鄉"],
  '嘉義縣': ["中埔鄉", "六腳鄉", "大埔鄉", "大林鎮", "太保市", "布袋鎮", "新港鄉", "朴子市", "東石鄉", "梅山鄉", "民雄鄉", "水上鄉", "溪口鄉", "番路鄉", "竹崎鄉", "義竹鄉", "鹿草鄉"],
  '屏東縣': ["三地門鄉", "九如鄉", "佳冬鄉", "內埔鄉", "南州鄉", "屏東巿", "崁頂鄉", "恆春鎮", "新園鄉", "新埤鄉", "春日鄉", "東港鎮", "枋寮鄉", "枋山鄉", "林邊鄉", "滿州鄉", "潮州鎮", "琉球鄉", "竹田鄉", "萬丹鄉", "萬巒鄉", "車城鄉", "里港鄉", "長治鄉", "霧台鄉", "高樹鄉", "鹽埔鄉", "麟洛鄉"],
  '宜蘭縣': ["三星鄉", "五結鄉", "冬山鄉", "南澳鄉", "員山鄉", "壯圍鄉", "大同鄉", "宜蘭市", "礁溪鄉", "羅東鎮", "蘇澳鎮", "頭城鎮"],
  '花蓮縣': ["光復鄉", "卓溪鄉", "吉安鄉", "壽豐鄉", "富里鄉", "新城鄉", "玉里鎮", "瑞穗鄉", "秀林鄉", "花蓮市", "萬榮鄉", "豐濱鄉", "鳳林鎮"],
  '臺東縣': ["卑南鄉", "台東市", "大武鄉", "太麻里鄉", "成功鎮", "東河鄉", "池上鄉", "海端鄉", "綠島鄉", "金鄉", "長濱鄉", "關山鎮", "鹿野鄉"],
  '澎湖縣': ["七美鄉", "望安鄉", "湖西鄉", "白沙鄉", "西嶼鄉", "馬公市"],
  '金門縣': ["烈嶼鄉", "金城鎮", "金寧鄉", "金沙鎮", "金湖鎮"],
  '連江縣': ["南竿鄉", "東引鄉", "莒光鄉"],
};

export default function SearchBar({ onSearchResults }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cities] = useState(TAIWAN_CITIES); // 使用硬編碼清單
  const [districts, setDistricts] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  // Load districts when city changes (使用硬編碼資料)
  const handleCityChange = (city) => {
    setSelectedCity(city);
    form.setFieldsValue({ district: undefined }); // Reset district

    if (city) {
      // 從硬編碼資料中獲取鄉鎮區清單（不需要 API）
      const cityDistricts = TAIWAN_DISTRICTS[city] || [];
      setDistricts(cityDistricts);
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
    <div style={{
      padding: 'var(--space-lg)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-md)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-border)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-md)',
        paddingBottom: 'var(--space-sm)',
        borderBottom: '2px solid var(--color-border)'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-accent)">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}>
          搜尋土地資料
        </span>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
      >
        <Space wrap style={{ width: '100%' }} size="middle">
          <Form.Item name="city" label="縣市" style={{ marginBottom: 0 }}>
            <Select
              placeholder="選擇縣市"
              style={{ width: 140 }}
              onChange={handleCityChange}
              allowClear
              showSearch
              suffixIcon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              }
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="district" label="鄉鎮市區" style={{ marginBottom: 0 }}>
            <Select
              placeholder="選擇鄉鎮市區"
              style={{ width: 140 }}
              disabled={!selectedCity}
              allowClear
              showSearch
              suffixIcon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              }
            >
              {districts.map(district => (
                <Option key={district} value={district}>{district}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="parcel_no" label="地號" style={{ marginBottom: 0 }}>
            <Input placeholder="例如:17-1" style={{ width: 150 }} />
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
                style={{ minWidth: '100px' }}
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
