"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

interface ComboBadgeProps {
  options?: Option[];
  title?: string;
  className?: string;
  onChange?: (option: Option | null) => void;
}

export function ComboBadge({
  options = [],
  title = "Library",
  className,
  onChange,
}: ComboBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<Option | null>(
    null
  );
  const [searchValue, setSearchValue] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    const search = searchValue.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(search)
    );
  }, [options, searchValue]);

  const handleSelect = (value: string) => {
    const option = options.find((opt) => opt.value === value);
    if (!option) return;

    const newSelection = selectedOption?.value === value ? null : option;
    setSelectedOption(newSelection);
    onChange?.(newSelection);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <div className={cn("inline-block h-7", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-sm font-normal hover:bg-transparent hover:text-foreground/80 data-[state=open]:bg-transparent"
          >
            {selectedOption?.label || "All images"}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-48" side="bottom" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Choose library..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No libraries found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className={cn(
                      "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      selectedOption?.value === option.value &&
                        "font-medium bg-accent text-accent-foreground"
                    )}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
