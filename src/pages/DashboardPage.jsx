import { Row, Col, Card, Statistic, Table, Typography, Tag, Spin, Alert } from 'antd';
import { BookOutlined, CheckCircleOutlined, UserOutlined, ReadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchStats, fetchRecentBooks } from '../api/adminApi.js';

const { Title } = Typography;

const recentColumns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (title, record) => <Link to={`/books/${record.id || record._id}/edit`}>{title}</Link>,
  },
  { title: 'Author', dataIndex: 'author' },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (status) => (
      <Tag color={status === 'published' ? 'green' : 'default'}>
        {status === 'published' ? 'Published' : 'Draft'}
      </Tag>
    ),
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    render: (d) => d ? new Date(d).toLocaleDateString() : '—',
  },
  {
    title: '',
    render: (_, record) => <Link to={`/books/${record.id || record._id}/edit`}>Edit</Link>,
  },
];

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const recentQuery = useQuery({ queryKey: ['recentBooks'], queryFn: fetchRecentBooks });

  const stats = statsQuery.data || {};
  const recentBooks = recentQuery.data?.books || recentQuery.data || [];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Dashboard</Title>

      {statsQuery.isError && (
        <Alert type="error" message={statsQuery.error?.message} style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={statsQuery.isLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Books"
                value={stats.totalBooks ?? '—'}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Published Books"
                value={stats.publishedBooks ?? '—'}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={stats.totalUsers ?? '—'}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Chapters"
                value={stats.totalChapters ?? '—'}
                prefix={<ReadOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card title="Recently Added Books">
        <Table
          dataSource={recentBooks}
          columns={recentColumns}
          rowKey={(r) => r.id || r._id}
          pagination={false}
          loading={recentQuery.isLoading}
          size="small"
        />
      </Card>
    </div>
  );
}
