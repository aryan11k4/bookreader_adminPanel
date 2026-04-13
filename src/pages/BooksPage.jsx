import { useState } from 'react';
import {
  Table, Button, Space, Tag, Avatar, Typography, Popconfirm, message, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchBooks, deleteBook } from '../api/adminApi.js';
import BookUploadModal from '../components/BookUploadModal.jsx';

const { Title } = Typography;

export default function BooksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });

  const books = data?.books || data || [];

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      message.success('Book deleted');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err) => message.error(err.message),
  });

  const columns = [
    {
      title: 'Cover',
      dataIndex: 'coverUrl',
      width: 64,
      render: (url, record) => (
        <Avatar
          shape="square"
          size={48}
          src={url}
          style={{ background: '#f0f0f0', color: '#aaa' }}
        >
          {record.title?.[0]}
        </Avatar>
      ),
    },
    { title: 'Title', dataIndex: 'title', sorter: (a, b) => a.title.localeCompare(b.title) },
    { title: 'Author', dataIndex: 'author' },
    { title: 'Genre', dataIndex: 'genre' },
    {
      title: 'Price',
      dataIndex: 'price',
      render: (p) => (p != null ? `$${Number(p).toFixed(2)}` : '—'),
    },
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
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Link to={`/books/${record.id || record._id}/edit`}>
            <Button size="small" icon={<EditOutlined />}>Edit</Button>
          </Link>
          <Popconfirm
            title="Delete this book?"
            onConfirm={() => deleteMutation.mutate(record.id || record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Books</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Add New Book
        </Button>
      </div>

      <Card>
        <Table
          dataSource={books}
          columns={columns}
          rowKey={(r) => r.id || r._id}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <BookUploadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
