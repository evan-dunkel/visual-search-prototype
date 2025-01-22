"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Change from interface to exported interface
export interface TagType {
  name: string;
  colorClass?: string;
  count?: number;
}

// Update props interface
interface TagSelectorProps {
  availableTags: TagType[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

// Update this utility function to work with Tailwind classes
function shouldUseLightVariant(colorClass: string) {
  // Default to dark text for unknown classes
  if (!colorClass) return true;

  // Map of Tailwind color classes that should use light text
  const darkBackgrounds = [
    "bg-blue-500",
    "bg-blue-600",
    "bg-red-500",
    "bg-cyan-500",
    "bg-black",
    "bg-maroon",
    "bg-gold",
    "bg-yellow-600",
    "bg-amber-600",
    "bg-red-900",
    "bg-blue-900",
  ];

  // Check if the colorClass contains any of the dark background classes
  return !darkBackgrounds.some((darkBg) => colorClass.includes(darkBg));
}

export function TagSelector({
  availableTags: allTags,
  selectedTags,
  onTagToggle,
}: TagSelectorProps) {
  const [showMoreTags, setShowMoreTags] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  // Update sort function
  const sortedTags = [...allTags].sort((a, b) => {
    const aSelected = selectedTags.includes(a.name);
    const bSelected = selectedTags.includes(b.name);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  // Show More button if we have more than 10 tags
  const shouldShowMoreButton = sortedTags.length > 10;
  const visibleTagCount = showMoreTags ? sortedTags.length : 9; // Show 9 tags + More button in compact mode

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: showMoreTags ? "auto" : "4.75rem" }}
      >
        <div
          ref={tagsContainerRef}
          className="flex flex-wrap pt-1 gap-x-2 gap-y-2 items-start pb-2"
        >
          <AnimatePresence mode="popLayout">
            {sortedTags.map((tag, index) => {
              const isSelected = selectedTags.includes(tag.name);

              // Show all tags if expanded or selected, otherwise show up to visibleTagCount
              const isVisible =
                showMoreTags || isSelected || index < visibleTagCount;

              if (!isVisible) return null;

              return (
                <motion.div
                  key={tag.name}
                  layout="position"
                  transition={{
                    layout: { type: "spring", stiffness: 1000, damping: 60 },
                  }}
                  className="inline items-center"
                >
                  <Badge
                    variant="outline"
                    className={`cursor-pointer flex items-center h-7 shrink-0 transition-colors duration-300 ease-in-out ${
                      tag.colorClass
                        ? `${tag.colorClass} hover:bg-opacity-80`
                        : isSelected
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        : ""
                    }`}
                    onClick={() => onTagToggle(tag.name)}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: isSelected ? "auto" : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex items-center"
                    >
                      <X className="mr-1 h-3 w-3" />
                    </motion.div>
                    {tag.name}
                    {typeof tag.count === "number" && (
                      <span
                        className={`ml-1.5 text-xs ${
                          tag.colorClass
                            ? shouldUseLightVariant(tag.colorClass)
                              ? "text-muted-foreground/70"
                              : "text-white/70"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        {tag.count}
                      </span>
                    )}
                  </Badge>
                </motion.div>
              );
            })}
            {/* Always render More/Less as a separate item at the end */}
            {shouldShowMoreButton && (
              <motion.div
                key="more-button"
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 1000, damping: 60 },
                }}
                className="inline items-center"
              >
                <button
                  className="text-blue-500 hover:text-blue-600 underline text-sm h-7 flex items-center"
                  onClick={() => setShowMoreTags(!showMoreTags)}
                >
                  {showMoreTags ? "Less" : "More"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
