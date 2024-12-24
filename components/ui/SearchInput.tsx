"use client";

import * as React from "react";
import { Input } from "./input";
import { FilterBadge } from "./comboBadge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  libraries?: Array<{ value: string; label: string }>;
  lists?: Array<{ value: string; label: string }>;
  selectedLibrary?: string | null;
  selectedLists?: string[];
  onSearch?: () => void;
  onCommaPress?: (value: string) => void;
  onLibraryChange?: (libraryId: string | null) => void;
  onListsChange?: (listIds: string[]) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      libraries = [],
      lists = [],
      selectedLibrary,
      selectedLists = [],
      onSearch,
      onCommaPress,
      onLibraryChange,
      onListsChange,
      placeholder = "Search images...",
      ...props
    },
    ref
  ) => {
    const [comboBadgeWidth, setComboBadgeWidth] = React.useState(0);
    const comboBadgeRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const updateWidth = () => {
        if (comboBadgeRef.current) {
          const width = comboBadgeRef.current.offsetWidth;
          setComboBadgeWidth(width);
        }
      };

      // Initial measurement
      updateWidth();

      // Set up resize observer to handle dynamic changes
      const resizeObserver = new ResizeObserver(updateWidth);
      if (comboBadgeRef.current) {
        resizeObserver.observe(comboBadgeRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "," && e.currentTarget.value.trim()) {
        e.preventDefault();
        onCommaPress?.(e.currentTarget.value.trim());
        const input = e.currentTarget;
        input.value = "";
        if (props.onChange) {
          const nativeEvent = new Event("input", { bubbles: true });
          input.dispatchEvent(nativeEvent);
        }
      }
    };

    // Update placeholder based on selections
    const getPlaceholder = () => {
      const parts: string[] = [];

      if (selectedLibrary) {
        const library = libraries.find((lib) => lib.value === selectedLibrary);
        if (library) {
          parts.push(`in ${library.label}`);
        }
      }

      if (selectedLists.length > 0) {
        const listNames = selectedLists
          .map((id) => lists.find((list) => list.value === id)?.label)
          .filter(Boolean);

        if (listNames.length === 1) {
          parts.push(`from ${listNames[0]}`);
        } else if (listNames.length > 1) {
          parts.push(`from ${listNames.length} lists`);
        }
      }

      return parts.length > 0
        ? `Search images ${parts.join(" ")}...`
        : placeholder;
    };

    return (
      <div className="flex flex-row items-center gap-2 min-h-[2.25rem] w-full">
        <form onSubmit={handleSubmit} className="relative flex-1 flex">
          <div
            ref={comboBadgeRef}
            className="absolute inset-y-0 left-0 flex items-center border-r pr-2"
          >
            <FilterBadge
              libraries={libraries}
              lists={lists}
              selectedLibrary={selectedLibrary}
              selectedLists={selectedLists}
              onLibraryChange={onLibraryChange}
              onListsChange={onListsChange}
            />
          </div>
          <Input
            {...props}
            ref={ref}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className={cn("w-full focus-visible:ring-offset-0 pr-9", className)}
            style={{
              paddingLeft: comboBadgeWidth
                ? `${comboBadgeWidth + 8}px`
                : undefined,
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full rounded-l-none outline-1 outline-black"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
