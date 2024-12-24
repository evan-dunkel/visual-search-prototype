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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FilterBadgeProps {
  libraries?: Array<{ value: string; label: string }>;
  lists?: Array<{
    value: string;
    label: string;
    updated: string;
    images: string[];
  }>;
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
    let filtered = lists;
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter((list) =>
        list.label.toLowerCase().includes(search)
      );
    }
    // Sort by updated time (most recent first)
    return filtered.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
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
    <div className={cn("inline-block h-7 select-none", className)}>
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
                  {filteredLibraries.map((library) => (
                    <CommandItem
                      key={library.value}
                      onSelect={() => handleLibraryChange(library.value)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={library.value}
                        checked={library.value === selectedLibrary}
                        onCheckedChange={(checked) => {
                          if (checked !== "indeterminate") {
                            handleLibraryChange(library.value);
                          }
                        }}
                      />
                      <Label htmlFor={library.value} className="flex-grow">
                        {library.label}
                      </Label>
                    </CommandItem>
                  ))}
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
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={list.value}
                        checked={selectedLists.includes(list.value)}
                        onCheckedChange={(checked) => {
                          if (checked !== "indeterminate") {
                            handleListToggle(list.value);
                          }
                        }}
                      />
                      <Label htmlFor={list.value} className="flex-grow">
                        {list.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {list.images.length}
                      </span>
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
