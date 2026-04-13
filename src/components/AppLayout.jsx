import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/books', icon: <BookOutlined />, label: 'Books' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/comments', icon: <CommentOutlined />, label: 'Comments' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = menuItems
    .map((i) => i.key)
    .filter((k) => k !== '/')
    .find((k) => location.pathname.startsWith(k)) || '/';

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        width={220}
        style={{
          background: '#141414',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{ padding: '20px 16px 8px' }}>
          <Title
            level={5}
            style={{ color: '#e8d5b0', margin: 0, letterSpacing: '0.02em', fontSize: 13 }}
          >
            📖 Whisper Reads Admin
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#141414', marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ padding: 28, height: '100vh', overflowY: 'auto', background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}