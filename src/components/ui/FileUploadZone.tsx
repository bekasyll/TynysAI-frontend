import { useState, useRef } from 'react';
import { Upload, FileImage, X, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { useToast } from './Toast';

interface FileUploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  maxSizeMb?: number;
  accept?: string[];
}

const DEFAULT_ACCEPT = ['image/jpeg', 'image/jpg', 'image/png'];

export default function FileUploadZone({
  file,
  onFileChange,
  maxSizeMb = 50,
  accept = DEFAULT_ACCEPT,
}: FileUploadZoneProps) {
  const { t } = useTranslation();
  const { error } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!accept.includes(f.type)) {
      error(t('upload.invalid_format'));
      return;
    }
    if (f.size > maxSizeMb * 1024 * 1024) {
      error(t('upload.too_large'));
      return;
    }
    onFileChange(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : file
          ? 'border-green-400 bg-green-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {file ? (
        <div className="space-y-2">
          <CheckCircle size={40} className="mx-auto text-green-500" />
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
            className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <X size={14} /> {t('upload.remove')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <FileImage size={40} className="mx-auto text-gray-300" />
          <p className="font-medium text-gray-600">{t('upload.drop_hint')}</p>
          <p className="text-sm text-gray-400">{t('upload.drop_sub')}</p>
          <Button type="button" variant="outline" size="sm" icon={<Upload size={14} />}>
            {t('upload.choose_file')}
          </Button>
        </div>
      )}
    </div>
  );
}
