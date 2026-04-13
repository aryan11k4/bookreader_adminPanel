import { Input, Button, Space, Table, Typography } from 'antd';
import { DeleteOutlined, MergeCellsOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ChapterEditor({ chapters, onChange }) {
  const handleTitleChange = (index, value) => {
    const updated = chapters.map((ch, i) =>
      i === index ? { ...ch, title: value } : ch
    );
    onChange(updated);
  };

  const handleDelete = (index) => {
    const updated = chapters.filter((_, i) => i !== index);
    // re-number
    onChange(updated.map((ch, i) => ({ ...ch, chapterNumber: i + 1 })));
  };

  const handleMergeWithNext = (index) => {
    if (index >= chapters.length - 1) return;
    const merged = {
      ...chapters[index],
      title: `${chapters[index].title} / ${chapters[index + 1].title}`,
      wordCount: (chapters[index].wordCount || 0) + (chapters[index + 1].wordCount || 0),
      content: (chapters[index].content || '') + '\n\n' + (chapters[index + 1].content || ''),
    };
    const updated = [
      ...chapters.slice(0, index),
      merged,
      ...chapters.slice(index + 2),
    ].map((ch, i) => ({ ...ch, chapterNumber: i + 1 }));
    onChange(updated);
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'chapterNumber',
      width: 48,
      render: (num) => <Text type="secondary">{num}</Text>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      render: (title, _, index) => (
        <Input
          value={title}
          onChange={(e) => handleTitleChange(index, e.target.value)}
          size="small"
          placeholder={`Chapter ${index + 1}`}
        />
      ),
    },
    {
      title: 'Words',
      dataIndex: 'wordCount',
      width: 80,
      render: (wc) => <Text type="secondary">{(wc || 0).toLocaleString()}</Text>,
    },
    {
      title: 'Actions',
      width: 140,
      render: (_, __, index) => (
        <Space size="small">
          <Button
            size="small"
            icon={<MergeCellsOutlined />}
            disabled={index >= chapters.length - 1}
            onClick={() => handleMergeWithNext(index)}
            title="Merge with next"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(index)}
            title="Delete chapter"
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={chapters}
      columns={columns}
      rowKey={(record, i) => record.id || record._id || i}
      size="small"
      pagination={false}
      scroll={{ y: 340 }}
    />
  );
}
