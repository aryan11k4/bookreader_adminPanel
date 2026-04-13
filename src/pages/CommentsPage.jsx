import { useState } from 'react';
import {
  Table, Input, DatePicker, Button, Card, Typography, message, Popconfirm, Space, Row, Col,
} from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, deleteComment } from '../api/adminApi.js';

const { Title } = Typography;
const { RangePicker } = DatePicker;

function truncate(str, len = 80) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function CommentsPage() {
  const [bookSearch, setBookSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments'],
    queryFn: fetchComments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      message.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (err) => message.error(err.message),
  });

  const allComments = data?.comments || data || [];

  const filtered = allComments.filter((c) => {
    const matchBook = !bookSearch ||
      c.bookTitle?.toLowerCase().includes(bookSearch.toLowerCase());
    const matchDate = !dateRange ||
      (new Date(c.createdAt) >= dateRange[0].toDate() &&
       new Date(c.createdAt) <= dateRange[1].toDate());
    return matchBook && matchDate;
  });

  const columns = [
    { title: 'Book Title', dataIndex: 'bookTitle', width: 160 },
    { title: 'Chapter', dataIndex: 'chapterTitle', width: 140 },
    { title: 'User', dataIndex: ['user', 'name'], render: (_, r) => r.user?.name || r.userName || '—' },
    {
      title: 'Comment',
      dataIndex: 'content',
      render: (text) => truncate(text),
    },
    {
      title: 'Upvotes',
      dataIndex: 'upvotes',
      width: 80,
      sorter: (a, b) => (a.upvotes || 0) - (b.upvotes || 0),
    },
    {
      title: 'Posted At',
      dataIndex: 'createdAt',
      width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString() : '—',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Delete this comment?"
          onConfirm={() => deleteMutation.mutate(record.id || record._id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Comments</Title>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by book title..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
          </Col>
          <Col>
            <RangePicker onChange={setDateRange} />
          </Col>
        </Row>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey={(r) => r.id || r._id}
          loading={isLoading}
          pagination={{ pageSize: 25 }}
        />
      </Card>
    </div>
  );
}
