import { Button } from "@/components/ui/button";
import { Image, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import React from "react";

interface ImageControlsProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isInitialized: boolean;
  imageLoaded: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputId: string;
  sampleImages: Array<{ name: string; path: string }>;
  onSampleSelect: (path: string) => void;
  currentImageSrc: string | null;
}

export function ImageControls({
  onFileChange,
  onReset,
  isInitialized,
  imageLoaded,
  fileInputRef,
  fileInputId,
  sampleImages,
  onSampleSelect,
  currentImageSrc,
}: ImageControlsProps) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-end items-center mb-1'>
        <Button onClick={onReset} disabled={!imageLoaded} variant='outline'>
          <X className='w-3 h-3 mr-1' />
          초기화
        </Button>
      </div>

      <div className='flex flex-col gap-4 items-stretch w-full'>
        <div className='flex-1 flex flex-col p-3 border rounded-lg'>
          <h4 className='text-sm font-semibold mb-3 text-center'>
            이미지 파일 업로드
          </h4>

          <label
            htmlFor={fileInputId}
            className='cursor-pointer w-full flex justify-center'
          >
            <Button
              asChild
              disabled={!isInitialized}
              size='default'
              className='gap-2 h-9 text-sm w-auto px-5'
              variant='outline'
            >
              <div>
                <Image className='w-4 h-4' />
                파일 선택
              </div>
            </Button>
            <Input
              id={fileInputId}
              type='file'
              accept='image/*'
              onChange={onFileChange}
              className='hidden'
              ref={fileInputRef}
              disabled={!isInitialized}
            />
          </label>
        </div>

        <div className='flex items-center justify-center py-1'>
          <span className='z-10 bg-background dark:bg-gray-900 px-3 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'>
            OR
          </span>
        </div>

        <div className='flex-1 flex flex-col p-3 border rounded-lg'>
          <h4 className='text-sm font-semibold mb-3 text-center'>
            샘플 이미지 선택
          </h4>
          <div
            className='flex gap-2 justify-start overflow-x-auto pb-1 px-3'
            style={{ scrollbarWidth: 'none' }}
          >
            {sampleImages.map((img) => (
              <Button
                key={img.path}
                onClick={() => onSampleSelect(img.path)}
                variant={currentImageSrc === img.path ? 'default' : 'outline'}
                size='sm'
                className='h-auto py-2 px-3 text-sm whitespace-nowrap flex-shrink-0'
                disabled={!isInitialized}
              >
                {img.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
