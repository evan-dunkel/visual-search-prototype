"use client";

import * as React from "react";
import { Input } from "./input";
import { ComboBadge } from "./comboBadge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  comboOptions?: Array<{ value: string; label: string }>;
  comboTitle?: string;
  onSearch?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, comboOptions, comboTitle, onSearch, ...props }, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.();
    };

    return (
      <div className="flex flex-row items-center gap-2 min-h-[2.25rem] w-full">
        <form onSubmit={handleSubmit} className="relative flex-1 flex">
          <div className="absolute inset-y-0 left-0 flex items-center border-r pr-2">
            <ComboBadge options={comboOptions} title={comboTitle} />
          </div>
          <Input
            {...props}
            ref={ref}
            className={cn(
              "pl-[8.5rem] pr-9 w-full focus-visible:ring-offset-0",
              className
            )}
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
