"use client";

import * as React from "react";
import { Input } from "./input";
import { ComboFilter } from "./comboFilter";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  libraries?: Array<{ value: string; label: string }>;
  lists?: Array<{
    value: string;
    label: string;
    updated: string;
    images: string[];
  }>;
  selectedLibrary?: string | null;
  selectedLists?: string[];
  onSearch?: () => void;
  onCommaPress?: (value: string) => void;
  onLibraryChange?: (libraryId: string | null) => void;
  onListsChange?: (listIds: string[]) => void;
  onListUpdate?: (listId: string, name: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
  onReset?: () => void;
  hasFilters?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      libraries = [],
      lists = [],
      selectedLibrary = null,
      selectedLists = [],
      onSearch,
      onCommaPress,
      onLibraryChange,
      onListsChange,
      onListUpdate,
      onListDelete,
      onReset,
      hasFilters = false,
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

    // Transform props for ComboFilter
    const transformedLibraries = libraries.map((lib) => ({
      id: lib.value,
      name: lib.label,
    }));

    const transformedLists = lists.map((list) => ({
      id: list.value,
      name: list.label,
      imageCount: list.images.length,
      updated: list.updated,
    }));

    const handleLibraryChange = (libraryId: string | null) => {
      onLibraryChange?.(libraryId);
    };

    const handleListsChange = (newLists: Set<string>) => {
      onListsChange?.(Array.from(newLists));
    };

    const handleListUpdate = async (listId: string, name: string) => {
      try {
        await onListUpdate?.(listId, name);
      } catch (error) {
        console.error("Error updating list:", error);
      }
    };

    const handleListDelete = async (listId: string) => {
      try {
        // First update the UI state
        if (selectedLists.includes(listId)) {
          onListsChange?.(selectedLists.filter((id) => id !== listId));
        }
        // Then delete the list
        await onListDelete?.(listId);
      } catch (error) {
        console.error("Error deleting list:", error);
        // If deletion fails, revert the UI state
        onListsChange?.(selectedLists);
      }
    };

    return (
      <div className="flex flex-row items-center gap-2 min-h-[2.25rem] w-full">
        <form onSubmit={handleSubmit} className="relative flex-1 flex">
          <div
            ref={comboBadgeRef}
            className="absolute inset-y-0 left-0 flex items-center border-r pr-2"
          >
            <ComboFilter
              libraries={transformedLibraries}
              lists={transformedLists}
              selectedLibrary={selectedLibrary}
              selectedLists={new Set(selectedLists)}
              onLibraryChange={handleLibraryChange}
              onListsChange={handleListsChange}
              onListUpdate={handleListUpdate}
              onListDelete={handleListDelete}
            />
          </div>
          <Input
            {...props}
            ref={ref}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className={cn(
              "w-full focus-visible:ring-offset-0 pr-20",
              className
            )}
            style={{
              paddingLeft: comboBadgeWidth
                ? `${comboBadgeWidth + 8}px`
                : undefined,
            }}
          />
          <div className="absolute right-0 h-full flex items-center gap-1 pr-2">
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onReset}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
