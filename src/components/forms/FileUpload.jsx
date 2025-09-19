import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTrashAlt, FaFilePdf, FaFileImage } from 'react-icons/fa';
import Button from '../ui/Button';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_MIME = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

/**
 * Componente de upload de archivo (voucher)
 * - Soporta PDF/JPG/PNG
 * - Tamaño máximo: 5MB
 * - Preview para imágenes
 * - Mensajería de error clara
 */
export default function FileUpload({
  label = 'Comprobante (voucher)',
  description = 'Formatos permitidos: PDF, JPG, PNG. Tamaño máximo 5MB.',
  value,            // File | null (controlado - opcional)
  onChange,         // (file|null) => void
  disabled = false,
  required = true,
  name = 'voucher',
  className = '',
}) {
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentFile = value !== undefined ? value : file;

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setErrorMsg('');

    if (fileRejections && fileRejections.length > 0) {
      const first = fileRejections[0];
      const reasons = first.errors?.map(e => e.message).join('. ') || 'Archivo inválido.';
      setErrorMsg(reasons);
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      if (value === undefined) setFile(f);
      onChange?.(f);
    }
  }, [onChange, value]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
    fileRejections,
  } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    maxSize: MAX_SIZE_BYTES,
    accept: ACCEPTED_MIME,
    noClick: true,
    noKeyboard: true,
  });

  useEffect(() => {
    if (fileRejections && fileRejections.length > 0) {
      const first = fileRejections[0];
      const reasons = first.errors?.map(e => e.message).join('. ') || 'Archivo inválido.';
      setErrorMsg(reasons);
    }
  }, [fileRejections]);

  const isImage = useMemo(() => {
    if (!currentFile) return false;
    return currentFile.type?.startsWith('image/');
  }, [currentFile]);

  const isPdf = useMemo(() => {
    if (!currentFile) return false;
    return currentFile.type === 'application/pdf';
  }, [currentFile]);

  const clearFile = () => {
    if (value === undefined) setFile(null);
    setErrorMsg('');
    onChange?.(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <div
        {...getRootProps({
          className: `
            mt-2 border-2 border-dashed rounded-md p-4 transition-colors
            ${isDragActive ? 'border-primary-600 bg-primary-50' : 'border-border hover:border-primary-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `
        })}
      >
        <input {...getInputProps({ name })} />
        {!currentFile ? (
          <div className="flex flex-col items-center text-center">
            <FaCloudUploadAlt className="w-10 h-10 text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">
              Arrastra y suelta el archivo aquí, o
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={open}
              disabled={disabled}
            >
              Seleccionar archivo
            </Button>
            <p className="text-xs text-text-muted mt-2">
              {description}
            </p>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-md border border-border overflow-hidden flex items-center justify-center bg-bg-tertiary">
                {isImage && (
                  <img
                    src={URL.createObjectURL(currentFile)}
                    alt="preview"
                    className="object-cover w-full h-full"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                )}
                {isPdf && <FaFilePdf className="w-8 h-8 text-error" />}
                {!isImage && !isPdf && <FaFileImage className="w-8 h-8 text-text-secondary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary break-all">
                  {currentFile.name}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {currentFile.type || 'application/octet-stream'} • {(currentFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {description}
                </p>
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-error border-error/40"
                onClick={clearFile}
                disabled={disabled}
                title="Quitar archivo"
              >
                <FaTrashAlt className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="mt-2 text-sm text-error">{errorMsg}</p>
      )}
    </div>
  );
}