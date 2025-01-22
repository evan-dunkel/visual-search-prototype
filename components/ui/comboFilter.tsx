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
import { EditableListItem } from "./editable-list-item";

interface ComboFilterProps {
  libraries: Array<{ id: string; name: string }>;
  lists: Array<{
    id: string;
    name: string;
    imageCount: number;
    updated: string;
  }>;
  selectedLibrary: string | null;
  selectedLists: Set<string>;
  onLibraryChange: (libraryId: string | null) => void;
  onListsChange: (listIds: Set<string>) => void;
  onListUpdate?: (listId: string, name: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
  className?: string;
}

export function ComboFilter({
  libraries,
  lists,
  selectedLibrary,
  selectedLists,
  onLibraryChange,
  onListsChange,
  onListUpdate,
  onListDelete,
  className,
}: ComboFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortedLists, setSortedLists] = React.useState(lists);

  // Update sorted lists when lists prop changes or menu opens
  React.useEffect(() => {
    setSortedLists(
      [...lists].sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      )
    );
  }, [lists]);

  // Filter both libraries and lists based on search query
  const filteredLibraries = React.useMemo(() => {
    return libraries.filter((lib) =>
      searchQuery
        ? lib.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [libraries, searchQuery]);

  const filteredLists = React.useMemo(() => {
    return sortedLists.filter((list) =>
      searchQuery
        ? list.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );
  }, [sortedLists, searchQuery]);

  const handleLibraryToggle = (libraryId: string) => {
    onLibraryChange(libraryId === selectedLibrary ? null : libraryId);
  };

  const handleListToggle = (listId: string) => {
    const newLists = new Set(selectedLists);
    if (newLists.has(listId)) {
      newLists.delete(listId);
    } else {
      newLists.add(listId);
    }
    onListsChange(newLists);
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
      // Remove the deleted list from selection if it was selected
      if (selectedLists.has(listId)) {
        const newLists = new Set(selectedLists);
        newLists.delete(listId);
        onListsChange(newLists);
      }
      await onListDelete?.(listId);
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const getDisplayText = () => {
    const parts: string[] = [];

    if (selectedLibrary) {
      const library = libraries.find((lib) => lib.id === selectedLibrary);
      if (library) parts.push(library.name);
    }

    if (selectedLists.size > 0) {
      const listText =
        selectedLists.size === 1
          ? lists.find((list) => list.id === Array.from(selectedLists)[0])?.name
          : `${selectedLists.size} lists`;
      if (listText) parts.push(listText);
    }

    return parts.length > 0 ? parts.join(" + ") : "All images";
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
        <PopoverContent className="p-0 w-64" align="start">
          <Command>
            <CommandInput
              placeholder="Search filters..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No filters found.</CommandEmpty>
              {filteredLibraries.length > 0 && (
                <CommandGroup heading="Libraries">
                  {filteredLibraries.map((library) => (
                    <CommandItem
                      key={library.id}
                      onSelect={() => handleLibraryToggle(library.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id={library.id}
                        checked={library.id === selectedLibrary}
                        onCheckedChange={() => handleLibraryToggle(library.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={library.id}
                        className="flex-grow"
                        onClick={(e) => e.preventDefault()}
                      >
                        {library.name}
                      </label>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filteredLibraries.length > 0 && filteredLists.length > 0 && (
                <CommandSeparator />
              )}
              {filteredLists.length > 0 && (
                <CommandGroup heading="Lists">
                  {filteredLists.map((list) => (
                    <EditableListItem
                      key={list.id}
                      id={list.id}
                      name={list.name}
                      count={list.imageCount}
                      checked={selectedLists.has(list.id)}
                      onCheckedChange={() => handleListToggle(list.id)}
                      onListChange={handleListUpdate}
                      onListDelete={handleListDelete}
                    />
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
