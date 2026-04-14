import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Modal, Steps, Upload, Button, Form, Input, Select, InputNumber,
  Row, Col, Typography, Alert, Spin, Space, message, Divider,
  Collapse, Popconfirm,
} from 'antd';
import {
  InboxOutlined, DeleteOutlined, PlusOutlined,
  UpOutlined, DownOutlined, CloseOutlined, RightOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadEpub, createBook } from '../api/adminApi.js';
import { uploadCoverToSupabase } from '../lib/supabase.js';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Text } = Typography;

const GENRE_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Fantasy',
  'Science Fiction', 'Romance', 'Biography', 'History', 'Other',
].map((g) => ({ label: g, value: g }));

const PANEL_HEIGHT = 360;

// ─── useDebounce ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Left Panel — ExtractedBlock ────────────────────────────────────────────
function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ExtractedBlock({ index, title, content, onAddChapter }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const textDivRef = useRef(null);
  const matchRefs = useRef([]);

  const debouncedQuery = useDebounce(query, 300);

  const blockTitle = (title && title.trim()) ? title.trim() : `Section ${index + 1}`;
  const words = wordCount(content);

  const segments = useMemo(() => {
    if (!debouncedQuery.trim() || !content) {
      return [{ text: content || '', isMatch: false }];
    }
    const escaped = debouncedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    const parts = content.split(re);
    let matchIdx = 0;
    return parts.map((part) => {
      if (re.test(part)) { re.lastIndex = 0; return { text: part, isMatch: true, matchIndex: matchIdx++ }; }
      re.lastIndex = 0;
      return { text: part, isMatch: false };
    });
  }, [debouncedQuery, content]);

  const matchCount = useMemo(() => segments.filter((s) => s.isMatch).length, [segments]);

  useEffect(() => { setCurrentMatchIndex(0); }, [debouncedQuery]);

  useEffect(() => {
    const container = textDivRef.current;
    const matchEl = matchRefs.current[currentMatchIndex];
    if (!matchCount || !container || !matchEl) return;
    let offsetTop = 0;
    let el = matchEl;
    while (el && el !== container) { offsetTop += el.offsetTop; el = el.offsetParent; }
    container.scrollTop = Math.max(0, offsetTop - container.clientHeight / 2 + matchEl.offsetHeight / 2);
  }, [currentMatchIndex, matchCount, debouncedQuery]);

  const goNext = () => setCurrentMatchIndex((i) => (i + 1) % matchCount);
  const goPrev = () => setCurrentMatchIndex((i) => (i - 1 + matchCount) % matchCount);
  const clearSearch = () => { setQuery(''); setCurrentMatchIndex(0); };

  matchRefs.current = [];

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
      {/* Block header */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: open ? '#f0fdf9' : '#fafafa', cursor: 'pointer',
          userSelect: 'none', borderBottom: open ? '1px solid #e5e7eb' : 'none',
        }}
      >
        <RightOutlined style={{
          fontSize: 10, color: '#6b7280', flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.18s ease',
        }} />
        <Text style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {blockTitle}
        </Text>
        <Text style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
          {words.toLocaleString()} words
        </Text>
      </div>

      {/* Block body */}
      {open && (
        <div style={{ padding: '10px 12px' }}>
          {/* Per-block search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Input
              size="small"
              placeholder="Search in this section..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.shiftKey ? goPrev() : goNext(); }
                if (e.key === 'Escape') clearSearch();
              }}
              style={{ flex: 1 }}
            />
            {query && (
              <>
                <Text style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', minWidth: 48, textAlign: 'center' }}>
                  {matchCount === 0 ? '0 of 0' : `${currentMatchIndex + 1} of ${matchCount}`}
                </Text>
                <Button size="small" icon={<UpOutlined />} disabled={matchCount === 0} onClick={goPrev} />
                <Button size="small" icon={<DownOutlined />} disabled={matchCount === 0} onClick={goNext} />
                <Button size="small" type="text" icon={<CloseOutlined />} onClick={clearSearch} />
              </>
            )}
          </div>

          {/* Text content */}
          <div
            ref={textDivRef}
            style={{
              maxHeight: 400, overflowY: 'auto',
              fontSize: 13, lineHeight: 1.7,
              fontFamily: 'Georgia, "Times New Roman", serif',
              whiteSpace: 'pre-wrap', userSelect: 'text', cursor: 'text',
            }}
          >
            {segments.map((seg, i) => {
              if (!seg.isMatch) return <span key={i}>{seg.text}</span>;
              const isActive = seg.matchIndex === currentMatchIndex;
              return (
                <span
                  key={i}
                  ref={(el) => { if (el) matchRefs.current[seg.matchIndex] = el; }}
                  style={{
                    background: isActive ? '#f97316' : '#fde047',
                    color: isActive ? '#fff' : 'inherit',
                    borderRadius: 2, padding: '0 1px',
                  }}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Left Panel ──────────────────────────────────────────────────────────────
function RawTextPanel({ extractedChapters, onAddChapter }) {
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, selectedText: '' });
  const popupRef = useRef(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) { setPopup((p) => ({ ...p, visible: false })); return; }
    const selected = selection.toString().trim();
    if (!selected) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopup({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + 8, selectedText: selected });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup((p) => ({ ...p, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseAsTitle = () => {
    onAddChapter({ title: popup.selectedText, content: '' });
    setPopup((p) => ({ ...p, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const handleUseAsContent = () => {
    onAddChapter({ title: null, content: popup.selectedText });
    setPopup((p) => ({ ...p, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div onMouseUp={handleMouseUp} style={{ position: 'relative' }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
        Extracted Sections
      </Text>

      {(!extractedChapters || extractedChapters.length === 0) ? (
        <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 13 }}>No sections extracted.</Text>
      ) : (
        extractedChapters.map((ch, i) => (
          <ExtractedBlock
            key={i}
            index={i}
            title={ch.title}
            content={ch.content}
            onAddChapter={onAddChapter}
          />
        ))
      )}

      {/* Selection popup */}
      {popup.visible && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', left: popup.x, top: popup.y,
            transform: 'translateX(-50%)', zIndex: 9999,
            display: 'flex', gap: 6,
            background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 6, padding: '6px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <Button size="small" type="primary" onClick={handleUseAsTitle}>Use as Chapter Title</Button>
          <Button size="small" onClick={handleUseAsContent}>Use as Content</Button>
        </div>
      )}
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────
function ChapterStructurePanel({ chapters, activeChapterId, onActiveChange, onChapterUpdate, onChapterDelete, onAddEmpty }) {
  const collapseItems = chapters.map((ch, index) => ({
    key: ch.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Text style={{ fontSize: 13 }}>{ch.title || `Chapter ${index + 1}`}</Text>
        <Popconfirm
          title="Delete this chapter?"
          onConfirm={(e) => { e?.stopPropagation(); onChapterDelete(ch.id); }}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </div>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Input
          size="small"
          placeholder="Chapter title"
          value={ch.title}
          onChange={(e) => onChapterUpdate(ch.id, { title: e.target.value })}
        />
        <TextArea
          rows={4}
          placeholder="Chapter content..."
          value={ch.content}
          onChange={(e) => onChapterUpdate(ch.id, { content: e.target.value })}
          style={{ fontSize: 12, fontFamily: 'Georgia, serif' }}
        />
      </div>
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: PANEL_HEIGHT }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
        Chapter Structure
        {chapters.length > 0 && <span style={{ marginLeft: 6, fontWeight: 400 }}>({chapters.length})</span>}
      </Text>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chapters.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Select text on the left to create chapters
            </Text>
          </div>
        ) : (
          <Collapse
            accordion
            activeKey={activeChapterId}
            onChange={(key) => onActiveChange(key)}
            items={collapseItems}
            size="small"
          />
        )}
        <Button
          dashed
          block
          icon={<PlusOutlined />}
          onClick={onAddEmpty}
          style={{ marginTop: 8 }}
        >
          Add Empty Chapter
        </Button>
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function BookUploadModal({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [rawText, setRawText] = useState('');
  const [chapters, setChapters] = useState([]);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  const addChapter = useCallback(({ title, content }) => {
    const id = crypto.randomUUID();
    const n = chapters.length + 1;
    setChapters((prev) => [...prev, { id, title: title || `Chapter ${n}`, content: content || '' }]);
    setActiveChapterId(id);
  }, [chapters.length]);

  const updateChapter = (id, fields) => {
    setChapters((prev) => prev.map((ch) => ch.id === id ? { ...ch, ...fields } : ch));
  };

  const deleteChapter = (id) => {
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    setActiveChapterId((prev) => (prev === id ? null : prev));
  };

  const uploadMutation = useMutation({
    mutationFn: uploadEpub,
    onSuccess: (data) => {
      setExtractedData(data);
      const raw = (data.chapters || []).map((ch) => ch.content || '').join('\n\n');
      setRawText(raw || data.rawText || '');
      form.setFieldsValue({
        title: data.extractedTitle || data.title || '',
        author: data.author || '',
        description: data.description || '',
        genre: data.genre || undefined,
        tags: data.tags?.join(', ') || '',
        price: data.price ?? undefined,
      });
      setCurrentStep(1);
    },
    onError: (err) => message.error(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      message.success('Book saved successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      handleClose();
    },
    onError: (err) => message.error(err.message),
  });

  const handleClose = () => {
    setCurrentStep(0);
    setExtractedData(null);
    setRawText('');
    setChapters([]);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setActiveChapterId(null);
    form.resetFields();
    onClose();
  };

  const handleUpload = (file) => {
    uploadMutation.mutate(file);
    return false;
  };

const handleSave = async (status) => {
  try {
    const values = await form.validateFields();
    let coverImageUrl = null;
    if (coverFile) {
      coverImageUrl = await uploadCoverToSupabase(coverFile);
    }
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
      chapters: chapters.map((ch, i) => ({
        title: ch.title,
        content: ch.content,
        chapterIndex: i,
      })),
      status,
      epubPath: extractedData?.epubPath,
      ...(coverImageUrl && { coverImageUrl }),
    };
    saveMutation.mutate(payload);
  } catch (err) {
    if (err?.errorFields) return; // ant design validation error, shown inline
    message.error(err.message);
  }
};

  return (
    <>
      <style>{`
        .no-scroll-modal .ant-modal-wrap {
          overflow: hidden !important;
        }
        .no-scroll-modal .ant-modal-content {
          display: flex !important;
          flex-direction: column !important;
          max-height: 90vh !important;
        }
        .no-scroll-modal .ant-modal-body {
          overflow-y: auto !important;
          flex: 1 !important;
          min-height: 0 !important;
        }
      `}</style>
    <Modal
      title="Add New Book"
      open={open}
      onCancel={handleClose}
      width={1100}
      centered
      wrapClassName="no-scroll-modal"
      styles={{
        content: { padding: 0 },
        header: { padding: '16px 24px 0', marginBottom: 0 },
        body: { padding: '16px 24px' },
        footer: { padding: '12px 24px' },
      }}
      footer={
        currentStep === 1 ? (
          <Space>
            <Button onClick={() => setCurrentStep(0)}>Back</Button>
            <Button onClick={() => handleSave('draft')} loading={saveMutation.isPending}>
              Save as Draft
            </Button>
            <Button type="primary" onClick={() => handleSave('published')} loading={saveMutation.isPending}>
              Publish
            </Button>
          </Space>
        ) : null
      }
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[{ title: 'Upload EPUB' }, { title: 'Review & Publish' }]}
        style={{ marginBottom: 20 }}
      />

      {/* ── Step 1: Upload ── */}
      {currentStep === 0 && (
        <Spin spinning={uploadMutation.isPending} tip="Extracting book data...">
          <Dragger
            accept=".epub"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={uploadMutation.isPending}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag an EPUB file here</p>
            <p className="ant-upload-hint">Only .epub files are accepted</p>
          </Dragger>
          {uploadMutation.isError && (
            <Alert type="error" message={uploadMutation.error?.message} style={{ marginTop: 12 }} showIcon />
          )}
        </Spin>
      )}

      {/* ── Step 2: Review & Publish ── */}
      {currentStep === 1 && (
        <>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="author" label="Author" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="genre" label="Genre">
                  <Select options={GENRE_OPTIONS} placeholder="Genre" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="price" label="Price">
                  <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="description" label="Description">
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="tags" label="Tags (comma separated)">
                  <Input placeholder="fantasy, magic, dragons" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Cover Image" style={{ marginBottom: 0 }}>
              <Space align="start">
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    setCoverFile(file);
                    setCoverPreviewUrl(URL.createObjectURL(file));
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>Choose Cover</Button>
                </Upload>
                {coverPreviewUrl && (
                  <img
                    src={coverPreviewUrl}
                    alt="cover preview"
                    style={{ height: 64, width: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }}
                  />
                )}
              </Space>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '8px 0 16px' }} />

          {/* Two-panel chapter editor — panels scroll internally, not the modal */}
          <Row gutter={0} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <Col span={12} style={{ padding: 16, borderRight: '1px solid #e5e7eb' }}>
              <RawTextPanel extractedChapters={extractedData?.chapters || []} onAddChapter={addChapter} />
            </Col>
            <Col span={12} style={{ padding: 16 }}>
              <ChapterStructurePanel
                chapters={chapters}
                activeChapterId={activeChapterId}
                onActiveChange={setActiveChapterId}
                onChapterUpdate={updateChapter}
                onChapterDelete={deleteChapter}
                onAddEmpty={() => addChapter({ title: null, content: '' })}
              />
            </Col>
          </Row>
        </>
      )}
    </Modal>
    </>
  );
}