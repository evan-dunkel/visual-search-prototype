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

const defaultOptions: Option[] = [
  {
    value: "backlog",
    label: "Backlog",
  },
  {
    value: "todo",
    label: "Todo",
  },
  {
    value: "in progress",
    label: "In Progress",
  },
  {
    value: "done",
    label: "Done",
  },
  {
    value: "canceled",
    label: "Canceled",
  },
];

interface ComboBadgeProps {
  options?: Option[];
  title?: string;
  className?: string;
  onChange?: (option: Option | null) => void;
}

export function ComboBadge({
  options = defaultOptions,
  title = "Library",
  className,
  onChange,
}: ComboBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<Option | null>(
    null
  );

  const handleSelect = (value: string) => {
    const option = options.find((opt) => opt.value === value);
    if (!option) return;

    const newSelection = selectedOption?.value === value ? null : option;
    setSelectedOption(newSelection);
    onChange?.(newSelection);
    setOpen(false);
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
            {selectedOption ? selectedOption.label : "All libraries"}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-48" side="bottom" align="start">
          <Command>
            <CommandInput placeholder="Choose library..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className={cn(
                      selectedOption?.value === option.value && "font-medium"
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
