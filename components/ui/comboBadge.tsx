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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";

type Option = {
  value: string;
  label: string;
};

interface FilterBadgeProps {
  libraries?: Option[];
  lists?: Option[];
  selectedLibrary?: string | null;
  selectedLists?: string[];
  onLibraryChange?: (libraryId: string | null) => void;
  onListsChange?: (listIds: string[]) => void;
  className?: string;
}

export function FilterBadge({
  libraries = [],
  lists = [],
  selectedLibrary = null,
  selectedLists = [],
  onLibraryChange,
  onListsChange,
  className,
}: FilterBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedLibraryOption = libraries.find(
    (lib) => lib.value === selectedLibrary
  );
  const selectedListsOptions = lists.filter((list) =>
    selectedLists.includes(list.value)
  );

  const filteredLibraries = React.useMemo(() => {
    if (!searchValue) return libraries;
    const search = searchValue.toLowerCase();
    return libraries.filter((lib) => lib.label.toLowerCase().includes(search));
  }, [libraries, searchValue]);

  const filteredLists = React.useMemo(() => {
    if (!searchValue) return lists;
    const search = searchValue.toLowerCase();
    return lists.filter((list) => list.label.toLowerCase().includes(search));
  }, [lists, searchValue]);

  const getDisplayText = () => {
    const parts: string[] = [];

    if (selectedLibraryOption) {
      parts.push(selectedLibraryOption.label);
    }

    if (selectedListsOptions.length > 0) {
      const listText =
        selectedListsOptions.length === 1
          ? selectedListsOptions[0].label
          : `${selectedListsOptions.length} lists`;
      parts.push(listText);
    }

    return parts.length > 0 ? parts.join(" + ") : "All images";
  };

  const handleLibraryChange = (libraryId: string) => {
    onLibraryChange?.(libraryId === selectedLibrary ? null : libraryId);
  };

  const handleListToggle = (listId: string) => {
    const newLists = selectedLists.includes(listId)
      ? selectedLists.filter((id) => id !== listId)
      : [...selectedLists, listId];
    onListsChange?.(newLists);
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
            {getDisplayText()}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-64" side="bottom" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search filters..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No filters found.</CommandEmpty>
              {(filteredLibraries.length > 0 || !searchValue) && (
                <CommandGroup heading="Libraries">
                  <RadioGroup
                    value={selectedLibrary || ""}
                    onValueChange={handleLibraryChange}
                  >
                    {filteredLibraries.map((library) => (
                      <CommandItem
                        key={library.value}
                        onSelect={() => handleLibraryChange(library.value)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <RadioGroupItem
                            value={library.value}
                            id={library.value}
                          />
                          <Label
                            htmlFor={library.value}
                            className="cursor-pointer flex-grow"
                          >
                            {library.label}
                          </Label>
                        </div>
                      </CommandItem>
                    ))}
                  </RadioGroup>
                </CommandGroup>
              )}
              {((filteredLibraries.length > 0 && filteredLists.length > 0) ||
                !searchValue) && <CommandSeparator />}
              {(filteredLists.length > 0 || !searchValue) && (
                <CommandGroup heading="Lists">
                  {filteredLists.map((list) => (
                    <CommandItem
                      key={list.value}
                      onSelect={() => handleListToggle(list.value)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Checkbox
                          id={list.value}
                          checked={selectedLists.includes(list.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={list.value}
                          className="cursor-pointer flex-grow"
                        >
                          {list.label}
                        </Label>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
