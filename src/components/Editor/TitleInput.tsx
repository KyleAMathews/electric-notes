import React from "react";

interface TitleInputProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export function TitleInput({ title, onChange, error }: TitleInputProps) {
  return (
    <div className="border-b border-gray-200 flex">
      <div className="flex-1 p-4">
        <input
          type="text"
          value={title}
          onChange={onChange}
          className={`w-full text-2xl font-bold focus:outline-none ${error ? 'border-red-500' : ''
            }`}
          placeholder="Untitled"
        />
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}
      </div>
    </div>
  );
}
