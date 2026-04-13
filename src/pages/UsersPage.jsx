import { useState } from 'react';
import { Table, Input, Tag, Button, Card, Typography, message, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole } from '../api/adminApi.js';

const { Title } = Typography;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      message.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => message.error(err.message),
  });

  const users = (data?.users || data || []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'gold' : 'blue'}>
          {role || 'USER'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (d) => d ? new Date(d).toLocaleDateString() : '—',
    },
    {
      title: 'Actions',
      render: (_, record) => {
        const isAdmin = record.role === 'ADMIN';
        return (
          <Button
            size="small"
            onClick={() => roleMutation.mutate(record.id || record._id)}
            loading={roleMutation.isPending}
            danger={isAdmin}
          >
            {isAdmin ? 'Remove Admin' : 'Make Admin'}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Users</Title>

      <Card>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360, marginBottom: 16 }}
          allowClear
        />
        <Table
          dataSource={users}
          columns={columns}
          rowKey={(r) => r.id || r._id}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
