"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

export type ComboboxOption = { value: string; label: string; description?: string };

export function Combobox({
  label,
  placeholder,
  loadingLabel,
  emptyLabel,
  loadOptions,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  loadingLabel: string;
  emptyLabel: string;
  loadOptions: (query: string) => Promise<ComboboxOption[]>;
  onChange?: (option: ComboboxOption) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let current = true;
    setLoading(true);
    void loadOptions(query)
      .then((nextOptions) => {
        if (!current) return;
        setOptions(nextOptions);
        setActiveIndex(nextOptions.length ? 0 : -1);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [loadOptions, query]);

  function choose(option: ComboboxOption) {
    setQuery(option.label);
    setOpen(false);
    onChange?.(option);
    inputRef.current?.focus();
  }

  return (
    <div className="ui-combobox">
      <label className="sr-only" htmlFor={`${id}-input`}>
        {label}
      </label>
      <span className="ui-combobox__control">
        <Icon name="search" size={18} />
        <input
          ref={inputRef}
          id={`${id}-input`}
          className="ui-control"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-busy={loading || undefined}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open) {
              const option = options[activeIndex];
              if (option) {
                event.preventDefault();
                choose(option);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <Icon name={open ? "chevron-up" : "chevron-down"} size={17} />
      </span>
      {open ? (
        <div className="ui-combobox__menu">
          <ul id={`${id}-listbox`} role="listbox" aria-label={label}>
            {options.map((option, index) => (
              <li
                id={`${id}-option-${index}`}
                key={option.value}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
                {index === activeIndex ? <Icon name="check" size={17} /> : null}
              </li>
            ))}
          </ul>
          <p className="ui-combobox__status" role="status">
            {loading ? loadingLabel : options.length === 0 ? emptyLabel : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
