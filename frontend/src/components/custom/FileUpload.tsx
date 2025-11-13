import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, File, FileImage, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string | Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number; // en bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  disabled = false,
  className,
  label,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      setError(`El archivo ${file.name} excede el tamaño máximo de ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };
  
  const getAcceptString = (): string => {
    if (typeof accept === 'string') return accept;
    if (typeof accept === 'object') {
      const extensions = Object.values(accept).flat();
      return extensions.join(', ');
    }
    return '';
  };
  
  const getAcceptAttribute = (): string | undefined => {
    if (typeof accept === 'string') return accept;
    if (typeof accept === 'object') {
      return Object.values(accept).flat().join(',');
    }
    return undefined;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (maxFiles && fileArray.length > maxFiles) {
      setError(`Solo puedes subir un máximo de ${maxFiles} archivos`);
      return;
    }

    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length > 0) {
      setSelectedFiles(multiple ? [...selectedFiles, ...validFiles] : validFiles);
      onFileSelect(validFiles);
      setError(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'cursor-pointer border-2 border-dashed transition-all duration-200',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className={cn('mb-4 h-10 w-10 text-muted-foreground', isDragging && 'text-primary')} />
          <h3 className="mb-2 text-sm font-semibold">
            {label || (isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {getAcceptString() || 'Todos los formatos'} • Máximo {(maxSize / 1024 / 1024).toFixed(0)}MB
            {multiple && ` • Hasta ${maxFiles} archivos`}
          </p>
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={getAcceptAttribute()}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="text-muted-foreground">{getFileIcon(file)}</div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

