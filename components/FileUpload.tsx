// Enhanced file upload component with modern animations
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/ui-utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tiff',
  maxSize = 10,
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('success');
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success': return 'border-emerald-500 bg-emerald-50/50';
      case 'error': return 'border-red-500 bg-red-50/50';
      default: return isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success': return <CheckCircleIcon className="w-12 h-12 text-emerald-500" />;
      case 'error': return <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />;
      default: return <CloudArrowUpIcon className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <motion.div
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer',
          'hover:shadow-lg hover:shadow-blue-500/10',
          getStatusColor()
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          borderColor: isDragOver ? '#3b82f6' : undefined,
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : undefined,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <motion.div 
          className="space-y-4"
          layout
        >
          <motion.div 
            className="flex justify-center"
            animate={{ 
              y: isDragOver ? -5 : 0,
              rotate: isDragOver ? 5 : 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {getStatusIcon()}
          </motion.div>
          
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div 
                key="selected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <p className="text-sm font-semibold text-gray-900">
                  ✓ Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
                {uploadStatus === 'error' && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-600"
                  >
                    File size exceeds {maxSize}MB limit
                  </motion.p>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <p className={cn(
                  "text-sm font-semibold transition-colors",
                  isDragOver ? "text-blue-700" : "text-gray-900"
                )}>
                  {isDragOver ? 'Drop your file here!' : 'Drop your medical file here, or click to browse'}
                </p>
                <p className="text-xs text-gray-500">
                  Supported: PDF, DOC, TXT, JPG, PNG, TIFF (max {maxSize}MB)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
                  className="p-2 bg-white rounded-xl shadow-sm"
                >
                  <DocumentIcon className="w-5 h-5 text-gray-600" />
                </motion.div>
                <div>
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-medium text-gray-900"
                  >
                    {selectedFile.name}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-gray-500"
                  >
                    {formatFileSize(selectedFile.size)}
                  </motion.p>
                </div>
              </div>
              <motion.button
                onClick={clearFile}
                className="p-2 hover:bg-red-100 rounded-xl transition-colors group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}