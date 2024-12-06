import React, { useRef, useEffect, useState } from "react";
import TextareaAutosize from 'react-textarea-autosize';

interface TitleInputProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}

export function TitleInput({ title, onChange, error }: TitleInputProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);

  const handleExternalUpdate = (newTitle: string) => {
    // Save cursor position before update
    if (inputRef.current) {
      cursorPositionRef.current = {
        start: inputRef.current.selectionStart,
        end: inputRef.current.selectionEnd
      };
    }

    // Update local title
    setLocalTitle(newTitle);

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      if (inputRef.current && cursorPositionRef.current) {
        inputRef.current.setSelectionRange(
          cursorPositionRef.current.start,
          cursorPositionRef.current.end
        );
      }
    });
  };

  useEffect(() => {
    handleExternalUpdate(title);
  }, [title]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalTitle(e.target.value);
    onChange(e);
  };

  return (
    <div className="border-b border-gray-200 flex">
      <div className="flex-1 p-4">
        <TextareaAutosize
          ref={inputRef}
          value={localTitle}
          onChange={handleLocalChange}
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
