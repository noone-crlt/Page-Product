import React, { useState, useEffect } from 'react';
import { TextT, ImageSquare, Columns, TextAa, Trash, List } from '@phosphor-icons/react';
import '../../styles/product-builder.css';

export type BlockType = 'heading' | 'text' | 'image' | 'columns';

export interface BuilderBlock {
  id: string;
  type: BlockType;
  content: any;
}

interface ProductBuilderProps {
  value: string;
  onChange: (val: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getDefaultContent = (type: BlockType) => {
  switch (type) {
    case 'heading': return { text: 'Tiêu đề mới', level: 2 };
    case 'text': return { text: 'Nhập nội dung văn bản...' };
    case 'image': return { url: '', alt: '' };
    case 'columns': return { left: 'Nội dung cột trái', right: 'Nội dung cột phải' };
    default: return {};
  }
};

export const ProductBuilder: React.FC<ProductBuilderProps> = ({ value, onChange }) => {
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [draggedToolType, setDraggedToolType] = useState<BlockType | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Parse value on mount
  useEffect(() => {
    try {
      if (value && value.trim().startsWith('[') && value.trim().endsWith(']')) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse builder JSON, falling back to raw text');
    }
    
    // Fallback for legacy text
    if (value && blocks.length === 0) {
      setBlocks([{ id: generateId(), type: 'text', content: { text: value } }]);
    }
  }, []);

  const notifyChange = (newBlocks: BuilderBlock[]) => {
    setBlocks(newBlocks);
    onChange(JSON.stringify(newBlocks));
  };

  const addBlock = (type: BlockType, index?: number) => {
    const newBlock: BuilderBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
    };
    
    const newBlocks = [...blocks];
    if (typeof index === 'number') {
      newBlocks.splice(index, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    notifyChange(newBlocks);
  };

  const updateBlock = (id: string, content: any) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content } : b);
    notifyChange(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    notifyChange(newBlocks);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    notifyChange(newBlocks);
  };

  // Drag handlers for Tools (Sidebar)
  const handleToolDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('builder/tool', type);
    setDraggedToolType(type);
  };

  const handleToolDragEnd = () => {
    setDraggedToolType(null);
  };

  // Drag handlers for Canvas Blocks
  const handleBlockDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('builder/blockIndex', String(index));
    setDraggedBlockIndex(index);
    // Needed for smooth dragging UX
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleBlockDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedBlockIndex(null);
    setHoverIndex(null);
  };

  // Canvas Dropzone Handlers
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setHoverIndex(null);

    const toolType = e.dataTransfer.getData('builder/tool') as BlockType;
    if (toolType) {
      addBlock(toolType, dropIndex);
      return;
    }

    const blockIndexStr = e.dataTransfer.getData('builder/blockIndex');
    if (blockIndexStr) {
      const fromIndex = parseInt(blockIndexStr, 10);
      let toIndex = dropIndex;
      // Adjust if dropping below itself
      if (fromIndex < toIndex) toIndex--;
      moveBlock(fromIndex, toIndex);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (blocks.length === 0) setHoverIndex(0);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHoverIndex(null);
    
    // Only handle if dropping at the very end (not on a specific block)
    const toolType = e.dataTransfer.getData('builder/tool') as BlockType;
    if (toolType) {
      addBlock(toolType);
      return;
    }

    const blockIndexStr = e.dataTransfer.getData('builder/blockIndex');
    if (blockIndexStr) {
      const fromIndex = parseInt(blockIndexStr, 10);
      moveBlock(fromIndex, blocks.length);
    }
  };

  return (
    <div className="product-builder">
      <aside className="builder-sidebar">
        <h4>Công cụ (Kéo thả)</h4>
        <div className="builder-tools">
          <div className="builder-tool" draggable onDragStart={(e) => handleToolDragStart(e, 'heading')} onDragEnd={handleToolDragEnd}>
            <TextT size={18} />
            <span>Tiêu đề</span>
          </div>
          <div className="builder-tool" draggable onDragStart={(e) => handleToolDragStart(e, 'text')} onDragEnd={handleToolDragEnd}>
            <TextAa size={18} />
            <span>Văn bản</span>
          </div>
          <div className="builder-tool" draggable onDragStart={(e) => handleToolDragStart(e, 'image')} onDragEnd={handleToolDragEnd}>
            <ImageSquare size={18} />
            <span>Hình ảnh lớn</span>
          </div>
          <div className="builder-tool" draggable onDragStart={(e) => handleToolDragStart(e, 'columns')} onDragEnd={handleToolDragEnd}>
            <Columns size={18} />
            <span>Hai cột</span>
          </div>
        </div>
      </aside>

      <div 
        className={`builder-canvas ${blocks.length === 0 ? 'is-empty' : ''}`}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {blocks.length === 0 && (
          <div className="builder-canvas-empty-state">
            <TextAa size={32} />
            <p>Kéo thả công cụ từ cột bên trái vào đây để bắt đầu thiết kế</p>
          </div>
        )}

        {blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            {hoverIndex === index && <div className="builder-drop-indicator" />}
            
            <div 
              className="builder-block"
              draggable
              onDragStart={(e) => handleBlockDragStart(e, index)}
              onDragEnd={handleBlockDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="builder-block-actions">
                <div className="builder-block-drag-handle">
                  <List size={16} />
                </div>
                <button type="button" onClick={() => removeBlock(block.id)} aria-label="Xóa khối">
                  <Trash size={16} />
                </button>
              </div>

              <div className="builder-block-content">
                {block.type === 'heading' && (
                  <input 
                    type="text" 
                    className="builder-input-heading"
                    value={block.content.text} 
                    onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                    placeholder="Nhập tiêu đề..."
                  />
                )}
                
                {block.type === 'text' && (
                  <textarea 
                    className="builder-input-text"
                    value={block.content.text} 
                    onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                    placeholder="Nhập nội dung..."
                    rows={4}
                  />
                )}

                {block.type === 'image' && (
                  <div className="builder-input-image">
                    <ImageSquare size={24} />
                    <input 
                      type="text" 
                      value={block.content.url}
                      onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
                      placeholder="Dán URL hình ảnh (vd: https://...)"
                    />
                    {block.content.url && <img src={block.content.url} alt="Preview" />}
                  </div>
                )}

                {block.type === 'columns' && (
                  <div className="builder-input-columns">
                    <textarea 
                      value={block.content.left} 
                      onChange={(e) => updateBlock(block.id, { ...block.content, left: e.target.value })}
                      placeholder="Cột trái..."
                      rows={3}
                    />
                    <textarea 
                      value={block.content.right} 
                      onChange={(e) => updateBlock(block.id, { ...block.content, right: e.target.value })}
                      placeholder="Cột phải..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
        {hoverIndex === blocks.length && <div className="builder-drop-indicator" />}
      </div>
    </div>
  );
};
