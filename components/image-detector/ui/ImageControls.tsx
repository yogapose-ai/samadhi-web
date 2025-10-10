import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageControlsProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isInitialized: boolean;
  imageLoaded: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ImageControls({
  onFileChange,
  onReset,
  isInitialized,
  imageLoaded,
  fileInputRef,
}: ImageControlsProps) {
  return (
    <div className='flex items-center gap-3'>
      <label htmlFor='image-upload' className='cursor-pointer'>
        <Button asChild disabled={!isInitialized} size='lg' className='gap-2'>
          <div>
            <Image className='w-4 h-4' />
            이미지 파일 선택
          </div>
        </Button>
        <Input
          id='image-upload'
          type='file'
          accept='image/*'
          multiple
          onChange={onFileChange}
          className='hidden'
          ref={fileInputRef}
        />
      </label>

      <Button
        onClick={onReset}
        disabled={!imageLoaded}
        variant='outline'
        size='lg'
        className='gap-2 text-gray-500'
      >
        <X className='w-4 h-4' />
        초기화
      </Button>

      {!isInitialized && (
        <Badge variant='secondary'>MediaPipe 초기화 중...</Badge>
      )}
    </div>
  );
}
