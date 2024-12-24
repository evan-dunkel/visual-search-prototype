"use client";

import * as React from "react";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateImageList, deleteImageList } from "@/lib/pocketbase";
import { CommandItem } from "@/components/ui/command";

interface EditableListItemProps {
  id: string;
  name: string;
  count?: number;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onListChange?: (listId: string, name: string) => Promise<void>;
  onListDelete?: (listId: string) => Promise<void>;
  showCheckbox?: boolean;
}

const EditingContext = createContext<boolean>(false);

export function EditableListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAnyItemEditing, setIsAnyItemEditing] = useState(false);
  return (
    <EditingContext.Provider value={isAnyItemEditing}>
      {children}
    </EditingContext.Provider>
  );
}

export function EditableListItem({
  id,
  name,
  count,
  checked = false,
  onCheckedChange,
  onListChange,
  onListDelete,
  showCheckbox = true,
}: EditableListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnyOtherItemEditing, setIsAnyOtherItemEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const [shouldSave, setShouldSave] = useState(false);

  useEffect(() => {
    const handleEditingChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const editingId = customEvent.detail?.id;
      setIsAnyOtherItemEditing(editingId !== undefined && editingId !== id);
    };

    document.addEventListener("editableListItemEditing", handleEditingChange);
    return () => {
      document.removeEventListener(
        "editableListItemEditing",
        handleEditingChange
      );
    };
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      const event = new CustomEvent("editableListItemEditing", {
        detail: { id },
      });
      document.dispatchEvent(event);
    }
    return () => {
      const event = new CustomEvent("editableListItemEditing", {
        detail: { id: null },
      });
      document.dispatchEvent(event);
    };
  }, [isEditing, id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (shouldSave) {
      handleSave();
      setShouldSave(false);
    }
  }, [shouldSave]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editedName.trim() === "") return;
    if (editedName === name) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onListChange?.(id, editedName.trim());
    } catch (error) {
      console.error("Error updating list:", error);
      setEditedName(name); // Reset to original name on error
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this list?")) {
      return;
    }

    setIsLoading(true);
    try {
      await onListDelete?.(id);
    } catch (error) {
      console.error("Error deleting list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is inside our component
    if (componentRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setShouldSave(true);
  };

  return (
    <div className="group/item">
      <CommandItem
        ref={componentRef}
        onSelect={() => {
          if (!isEditing && onCheckedChange) {
            onCheckedChange(!checked);
          }
        }}
        className={`flex items-center gap-2 cursor-pointer group h-8 ${
          isEditing ? "data-[selected]:bg-transparent" : ""
        } ${isEditing ? "opacity-100" : "group-has-[.editing]:opacity-40"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showCheckbox && (
          <Checkbox
            id={id}
            checked={checked}
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean" && onCheckedChange) {
                onCheckedChange(checked);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div
          className={`flex-grow flex items-center gap-2 ${
            isEditing ? "editing" : ""
          }`}
        >
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-6 py-0"
              disabled={isLoading}
            />
          ) : (
            <span className="flex-grow" onClick={(e) => e.preventDefault()}>
              {name}
            </span>
          )}
        </div>
        {!isEditing && (
          <div className="relative w-12 h-6 flex items-center justify-end">
            <span
              className={`absolute text-xs text-muted-foreground transition-opacity ${
                isHovered ? "opacity-0" : "opacity-100"
              }`}
            >
              {count}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute h-6 px-2 transition-opacity hover:bg-secondary ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              disabled={isLoading}
              onMouseEnter={(e) => {
                e.stopPropagation();
                const cmdkItem = e.currentTarget.closest("[cmdk-item]");
                if (cmdkItem) {
                  cmdkItem.setAttribute("data-selected", "false");
                }
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                const cmdkItem = e.currentTarget.closest("[cmdk-item]");
                if (cmdkItem) {
                  cmdkItem.setAttribute("data-selected", "true");
                }
              }}
            >
              Edit
            </Button>
          </div>
        )}
        {isEditing && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(e);
              }}
              disabled={isLoading}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={isLoading}
            >
              Save
            </Button>
          </>
        )}
      </CommandItem>
    </div>
  );
}
