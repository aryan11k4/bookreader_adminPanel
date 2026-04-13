import { useState, useEffect } from 'react';
import {
  Form, Input, Select, InputNumber, Button, Card, Row, Col,
  Typography, Space, Spin, Alert, message, Upload, Image,
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { fetchBook, updateBook, uploadCover, toggleBookStatus } from '../api/adminApi.js';
import ChapterEditor from '../components/ChapterEditor.jsx';
import { fetchBook, updateBook, uploadCover, toggleBookStatus, fetchBookChapters } from '../api/adminApi.js';

const { TextArea } = Input;
const { Title } = Typography;

const GENRE_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Fantasy',
  'Science Fiction', 'Romance', 'Biography', 'History', 'Other',
].map((g) => ({ label: g, value: g }));

export default function EditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [chapters, setChapters] = useState([]);

  const { data: book, isLoading, isError, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBook(id),
  });

  const { data: chaptersData } = useQuery({
  queryKey: ['book-chapters', id],
  queryFn: () => fetchBookChapters(id),
  enabled: !!book, // only fetch after book loads
  });

  useEffect(() => {
    if (book) {
      form.setFieldsValue({
        title: book.title,
        author: book.author,
        description: book.description,
        genre: book.genre,
        tags: book.tags?.join(', '),
        price: book.price,
      });
    }
  }, [book, form]);

  useEffect(() => {
  if (chaptersData) {
    setChapters(chaptersData);
  }
  }, [chaptersData]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateBook(id, data),
    onSuccess: () => {
      message.success('Book updated');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
    },
    onError: (err) => message.error(err.message),
  });

  const coverMutation = useMutation({
    mutationFn: (file) => uploadCover(id, file),
    onSuccess: () => {
      message.success('Cover updated');
      queryClient.invalidateQueries({ queryKey: ['book', id] });
    },
    onError: (err) => message.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: () => toggleBookStatus(id),
    onSuccess: () => {
      message.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err) => message.error(err.message),
  });

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      updateMutation.mutate({
        ...values,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
        chapters,
      });
    } catch {
      // form validation shown inline
    }
  };

  if (isLoading) return <Spin style={{ display: 'block', marginTop: 80 }} />;
  if (isError) return <Alert type="error" message={error?.message} />;

  const isPublished = book?.status === 'published';

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/books')}>
          Back to Books
        </Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Edit Book</Title>
        <Space>
          <Button
            onClick={() => toggleMutation.mutate()}
            loading={toggleMutation.isPending}
          >
            {isPublished ? 'Set as Draft' : 'Publish'}
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Book Metadata">
            <Form form={form} layout="vertical">
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="author" label="Author" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item name="genre" label="Genre">
                <Select options={GENRE_OPTIONS} placeholder="Select genre" />
              </Form.Item>
              <Form.Item name="tags" label="Tags (comma separated)">
                <Input />
              </Form.Item>
              <Form.Item name="price" label="Price">
                <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Card>

          <Card title="Cover Image" style={{ marginTop: 16 }}>
            {book?.coverUrl && (
              <div style={{ marginBottom: 12 }}>
                <Image
                  src={book.coverUrl}
                  width={120}
                  style={{ borderRadius: 4 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg=="
                />
              </div>
            )}
            <Upload
              accept="image/*"
              beforeUpload={(file) => {
                coverMutation.mutate(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={coverMutation.isPending}>
                Replace Cover
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col span={12}>
          <Card title={`Chapters (${chapters.length} total)`}>
            <ChapterEditor chapters={chapters} onChange={setChapters} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
