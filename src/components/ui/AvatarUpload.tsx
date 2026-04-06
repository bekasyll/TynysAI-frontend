import { useRef, useState, useCallback } from 'react';
import { Camera, Trash2, Loader2, Check, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from './Toast';

interface AvatarUploadProps {
  size?: 'md' | 'lg';
}

const sizeClasses = {
  md: { wrapper: 'w-14 h-14', text: 'text-xl', icon: 16 },
  lg: { wrapper: 'w-20 h-20', text: 'text-3xl', icon: 18 },
};

function centerAspectCrop(width: number, height: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
    width,
    height,
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const size = Math.min(crop.width, crop.height) * Math.max(scaleX, scaleY);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg', 0.9);
  });
}

export default function AvatarUpload({ size = 'lg' }: AvatarUploadProps) {
  const { user, updateAvatar } = useAuthStore();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const s = sizeClasses[size];

  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (res) => {
      const base64 = res.data.data?.avatarBase64 ?? null;
      updateAvatar(base64);
      success(t('avatar.change'));
    },
    onError: () => error(t('avatar.upload_error')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteAvatar(),
    onSuccess: () => { updateAvatar(null); success(t('avatar.delete')); },
    onError: () => error(t('avatar.delete_error')),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      error(t('upload.invalid_format'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error(t('upload.too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSrcImage(ev.target?.result as string);
      setCrop(undefined);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  async function handleConfirmCrop() {
    if (!imgRef.current || !completedCrop) return;
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      setSrcImage(null);
      uploadMutation.mutate(file);
    } catch {
      error(t('avatar.upload_error'));
    }
  }

  function handleCancelCrop() {
    setSrcImage(null);
    setCrop(undefined);
  }

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;
  const avatarSrc = user?.avatarBase64 ?? null;
  const initial = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <>
      {/* Avatar circle */}
      <div className="relative group w-fit">
        <div className={`${s.wrapper} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center shrink-0`}>
          {isLoading ? (
            <Loader2 className="animate-spin text-white" size={s.icon} />
          ) : avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`text-white font-bold ${s.text}`}>{initial}</span>
          )}
        </div>

        {!isLoading && (
          <div
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={s.icon} className="text-white" />
          </div>
        )}

        {!isLoading && avatarSrc && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(); }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
            title={t('avatar.delete')}
          >
            <Trash2 size={10} className="text-white" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Crop modal */}
      {srcImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('avatar.crop_title')}</h3>
              <button onClick={handleCancelCrop} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex items-center justify-center bg-gray-50 min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={srcImage}
                  alt=""
                  onLoad={onImageLoad}
                  className="max-h-[400px] max-w-full object-contain"
                />
              </ReactCrop>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={handleCancelCrop}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={14} /> {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmCrop}
                disabled={!completedCrop}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} /> {t('avatar.crop_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
