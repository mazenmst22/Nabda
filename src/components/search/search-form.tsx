"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function SearchForm({
  locale,
  placeholder,
  action,
  hint,
  initialQuery = "",
}: {
  locale: string;
  placeholder: string;
  action: string;
  hint: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    router.push(`/${locale}/search${search ? `?q=${encodeURIComponent(search)}` : ""}`);
  }

  return (
    <form className="hero-search" onSubmit={submit} role="search">
      <div className="search-input-wrap">
        <Icon name="search" size={22} />
        <label className="sr-only" htmlFor="doctor-search">
          {placeholder}
        </label>
        <input
          id="doctor-search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      <button type="submit">
        <span>{action}</span>
        <Icon name="arrow" size={19} />
      </button>
      <span className="search-hint">{hint}</span>
    </form>
  );
}
