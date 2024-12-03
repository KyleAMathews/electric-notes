import React from 'react';

interface TitleInputProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TitleInput({ title, onChange }: TitleInputProps) {
  return (
    <input
      type="text"
      value={title}
      onChange={onChange}
      className="text-3xl font-bold p-4 border-b border-gray-200 focus:outline-none w-full"
      placeholder="Note title"
    />
  );
}