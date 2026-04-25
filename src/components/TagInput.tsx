"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ label, values, onChange, placeholder }: Props) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  function remove(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && input === "" && values.length > 0) {
      remove(values[values.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="min-h-[42px] flex flex-wrap gap-2 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 focus-within:border-white">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-zinc-700 text-white text-sm rounded px-2 py-0.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-zinc-400 hover:text-white ml-1 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white focus:outline-none"
        />
      </div>
      <p className="text-xs text-zinc-500">Press Enter or comma to add</p>
    </div>
  );
}
