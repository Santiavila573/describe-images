
import React, { useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  }, [onImageUpload, disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const dragDropClasses = isDragging
    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="flex flex-col h-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex-grow flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-xl transition-all duration-300 ${dragDropClasses} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        {imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-md"/>
          </div>
        ) : (
          <div className="text-center">
            <Icon name="upload" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-primary-DEFAULT">Arrastra y suelta</span> una imagen aquí, o{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={disabled}
                className="font-semibold text-primary-DEFAULT hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-DEFAULT"
              >
                explora
              </button>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, GIF, WEBP hasta 4MB</p>
          </div>
        )}
      </div>
    </div>
  );
};
