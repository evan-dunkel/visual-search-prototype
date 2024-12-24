"use client";

import * as React from "react";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ImageList,
  createImageList,
  addImageToList,
  removeImageFromList,
} from "@/lib/pocketbase";
import { useState, useEffect, useRef } from "react";

interface AddToListButtonProps {
  imageId: string;
  lists: ImageList[];
  onListsChange?: () => void;
}

export function AddToListButton({
  imageId,
  lists,
  onListsChange,
}: AddToListButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [loadingLists, setLoadingLists] = useState<Set<string>>(new Set());
  const pendingOperations = useRef<
    Map<string, { type: "add" | "remove"; promise: Promise<void> }>
  >(new Map());

  // Update selected lists when lists prop changes
  useEffect(() => {
    const initialSelected = new Set(
      lists
        .filter((list) => list.images.includes(imageId))
        .map((list) => list.id)
    );
    setSelectedLists(initialSelected);
  }, [lists, imageId]);

  const toggleList = async (listId: string, checked: boolean) => {
    // If there's a pending operation, wait for it to complete
    const pendingOp = pendingOperations.current.get(listId);
    if (pendingOp) {
      await pendingOp.promise;
    }

    const wasSelected = selectedLists.has(listId);
    if (wasSelected === checked) return; // No change needed

    // Optimistically update UI
    if (checked) {
      setSelectedLists((prev) => new Set([...prev, listId]));
    } else {
      setSelectedLists((prev) => {
        const newSet = new Set(prev);
        newSet.delete(listId);
        return newSet;
      });
    }

    setLoadingLists((prev) => new Set([...prev, listId]));

    // Create the operation promise
    const operationPromise = (async () => {
      try {
        if (!wasSelected && checked) {
          await addImageToList(listId, imageId);
        } else if (wasSelected && !checked) {
          await removeImageFromList(listId, imageId);
        }
        onListsChange?.();
      } catch (error) {
        console.error("Error toggling list:", error);
        // Revert the optimistic update on error
        if (checked) {
          setSelectedLists((prev) => {
            const newSet = new Set(prev);
            newSet.delete(listId);
            return newSet;
          });
        } else {
          setSelectedLists((prev) => new Set([...prev, listId]));
        }
      } finally {
        setLoadingLists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(listId);
          return newSet;
        });
        pendingOperations.current.delete(listId);
      }
    })();

    // Store the operation
    pendingOperations.current.set(listId, {
      type: checked ? "add" : "remove",
      promise: operationPromise,
    });

    await operationPromise;
  };

  const handleCreateList = async () => {
    const trimmedName = newListName.trim();
    if (!trimmedName) return;

    // Check if a list with this name already exists
    const existingList = lists.find(
      (list) => list.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingList) {
      // If the list exists but isn't selected, select it
      if (!selectedLists.has(existingList.id)) {
        toggleList(existingList.id, true);
      }
      setNewListName("");
      return;
    }

    setLoading(true);
    try {
      const newList = await createImageList({ name: trimmedName });
      await addImageToList(newList.id, imageId);
      setNewListName("");
      setSelectedLists((prev) => new Set([...prev, newList.id]));
      onListsChange?.();
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLists = lists.filter((list) =>
    searchQuery
      ? list.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const isInLists = selectedLists.size > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isInLists ? "default" : "secondary"}
          size="icon"
          className={`absolute top-2 right-2 transition-all hover:opacity-100 ${
            isInLists ? "opacity-90" : "opacity-0 group-hover:opacity-100"
          } [&:hover]:opacity-100 [&[data-state=open]]:opacity-100`}
        >
          {isInLists ? (
            <ListChecks className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="end">
        <Command>
          <CommandInput
            placeholder="Search lists..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No lists found.</CommandEmpty>
            <CommandGroup>
              {filteredLists.map((list) => (
                <CommandItem
                  key={list.id}
                  onSelect={() =>
                    toggleList(list.id, !selectedLists.has(list.id))
                  }
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={list.id}
                    checked={selectedLists.has(list.id)}
                    disabled={loadingLists.has(list.id)}
                    onCheckedChange={(checked) =>
                      toggleList(list.id, checked as boolean)
                    }
                    className={
                      loadingLists.has(list.id) ? "opacity-50 cursor-wait" : ""
                    }
                  />
                  <label
                    htmlFor={list.id}
                    className={`flex-grow cursor-pointer ${
                      loadingLists.has(list.id) ? "opacity-50" : ""
                    }`}
                  >
                    {list.name}
                  </label>
                </CommandItem>
              ))}
              {!searchQuery && (
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Create new list..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateList();
                        }
                      }}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      disabled={!newListName.trim() || loading}
                      onClick={handleCreateList}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
