import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success?: string; error?: string }>({});

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setUploadStatus({});
      } else {
        setUploadStatus({ error: 'Please select a PDF or image file' });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({ error: 'Please select a file first' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({ success: 'File uploaded successfully! Upload ID: ' + response.data.uploadId });
      setFile(null);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setUploadStatus({ error: 'Error uploading file. Please try again.' });
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Timetable</h2>
      <div className="upload-box">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        <p className="file-info">
          {file ? `Selected file: ${file.name}` : 'No file selected'}
        </p>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {uploadStatus.success && (
        <div className="success-message">{uploadStatus.success}</div>
      )}
      {uploadStatus.error && (
        <div className="error-message">{uploadStatus.error}</div>
      )}
    </div>
  );
};

export default FileUpload;