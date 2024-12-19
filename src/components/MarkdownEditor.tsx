import React, { useState } from 'react';
import { FileService } from '../services/fileService';

const fileService = new FileService();

export const MarkdownEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState('');

  const handleSave = async () => {
    try {
      if (!filePath.endsWith('.md')) {
        alert('File must have .md extension');
        return;
      }
      
      await fileService.createFile(filePath, content);
      alert('File saved successfully!');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Enter file path (e.g., notes/example.md)"
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter markdown content"
          className="w-full h-64 p-2 border rounded"
        />
      </div>
      <button 
        onClick={handleSave}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Save File
      </button>
    </div>
  );
}; 