import React from "react";
import TextareaAutosize from 'react-textarea-autosize';

interface TitleInputProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}

export function TitleInput({ title, onChange, error }: TitleInputProps) {
  return (
    <div className="border-b border-gray-200 flex">
      <div className="flex-1 p-4">
        <TextareaAutosize
          value={title}
          onChange={onChange}
          className={`w-full break-normal text-2xl font-bold focus:outline-none resize-none ${
            error ? 'border-red-500' : ''
          }`}
          placeholder="Untitled"
          minRows={1}
        />
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}
      </div>
    </div>
  );
}
