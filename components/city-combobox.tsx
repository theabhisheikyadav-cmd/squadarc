"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fold } from "@/lib/text";

type Props = {
  country: string;
  defaultValue?: string;
  invalid?: boolean;
  className: string;
};

type Option = { city: string; kind: "listed" | "typed" | "manual" };

/**
 * Searchable city picker. Suggests cities for the chosen country, and lets people
 * type their own city when it isn't in the list (the dataset misses smaller towns).
 */
export function CityCombobox({ country, defaultValue = "", invalid, className }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [manual, setManual] = useState(false);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear the city when the country changes.
  const [prevCountry, setPrevCountry] = useState(country);
  if (country !== prevCountry) {
    setPrevCountry(country);
    setValue("");
    setSuggestions([]);
  }

  useEffect(() => {
    if (!country || !open || manual) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/cities?country=${country}&q=${encodeURIComponent(value)}`,
          { signal: controller.signal },
        );
        const data: { cities: string[] } = await res.json();
        setSuggestions(data.cities);
        setActive(-1);
      } catch {
        // Aborted or offline: keep the last suggestions.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [country, value, open, manual]);

  const typed = value.trim();
  const exact = suggestions.some((c) => fold(c) === fold(typed));
  const options: Option[] = suggestions.map((city) => ({ city, kind: "listed" }));
  if (typed.length >= 2 && !exact) options.push({ city: typed, kind: "typed" });
  // Always offered last: the list covers the link below it while open.
  options.push({ city: "", kind: "manual" });

  function pick(o: Option) {
    if (o.kind === "manual") switchMode(true);
    else choose(o.city);
  }

  function choose(city: string) {
    setValue(city);
    setOpen(false);
    inputRef.current?.focus();
  }

  function switchMode(toManual: boolean) {
    setManual(toManual);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const showList = open && !manual && !!country;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        {manual ? (
          <input
            ref={inputRef}
            id="city"
            name="city"
            placeholder="Type your city name"
            autoComplete="address-level2"
            required
            aria-invalid={invalid}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={className}
          />
        ) : (
          <input
            ref={inputRef}
            id="city"
            name="city"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={invalid}
            placeholder={country ? "Search your city" : "Pick a country first"}
            disabled={!country}
            autoComplete="off"
            required
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % options.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
              } else if (e.key === "Enter" && active >= 0) {
                e.preventDefault();
                pick(options[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className={`${className} disabled:opacity-50`}
          />
        )}
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-surface py-1 shadow-2xl"
          >
            {options.map((o, i) => (
              <li
                key={o.kind === "listed" ? o.city : o.kind}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown fires before the input's blur, so the pick isn't lost.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                className={`cursor-pointer px-4 py-3 text-left text-base ${
                  o.kind === "listed" ? "text-fg" : "text-ice"
                } ${o.kind === "typed" || (o.kind === "manual" && suggestions.length > 0) ? "border-t border-line" : ""} ${
                  i === active ? "bg-ice/15" : "hover:bg-ice/10"
                }`}
              >
                {o.kind === "listed" && o.city}
                {o.kind === "typed" && `Use “${o.city}”`}
                {o.kind === "manual" && "My city isn't listed, let me type it"}
              </li>
            ))}
          </ul>
        )}
      </div>
      {country && (
        <button
          type="button"
          onClick={() => switchMode(!manual)}
          className="self-start px-1 text-sm text-muted underline underline-offset-4 hover:text-fg"
        >
          {manual ? "Search the city list instead" : "My city isn't listed"}
        </button>
      )}
    </div>
  );
}
