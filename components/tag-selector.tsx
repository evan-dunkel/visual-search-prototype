"use client";

import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Change from interface to exported interface
export interface TagType {
  name: string;
  colorClass?: string;
}

// Update props interface
interface TagSelectorProps {
  availableTags: TagType[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery?: string;
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
  ];

  return !darkBackgrounds.includes(colorClass);
}

export function TagSelector({
  availableTags: allTags,
  selectedTags,
  onTagToggle,
  searchQuery = "",
}: TagSelectorProps) {
  const [showMoreTags, setShowMoreTags] = useState(false);

  // Update sort function
  const sortedTags = [...allTags].sort((a, b) => {
    const aSelected = selectedTags.includes(a.name);
    const bSelected = selectedTags.includes(b.name);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const getAvailableTags = () => {
    return allTags.filter(
      (tag) =>
        tag?.name &&
        !selectedTags.includes(tag.name) &&
        tag.name.toLowerCase().includes(searchQuery?.toLowerCase() || "")
    );
  };

  const INITIAL_TAGS_COUNT = 6;
  const availableTags = getAvailableTags();
  const visibleTags = showMoreTags
    ? availableTags
    : availableTags.slice(0, INITIAL_TAGS_COUNT);

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-x-2 gap-y-2 items-start ${
          showMoreTags ? "min-h-8" : "h-8 overflow-hidden"
        } ${showMoreTags ? "mb-10" : ""}`}
      >
        <AnimatePresence mode="popLayout">
          {sortedTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            const isVisible =
              isSelected ||
              (!isSelected &&
                tag?.name
                  ?.toLowerCase()
                  .includes((searchQuery || "").toLowerCase()) &&
                (showMoreTags ||
                  availableTags.indexOf(tag) < INITIAL_TAGS_COUNT));

            if (!isVisible) return null;

            return (
              <motion.div
                key={tag.name}
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 1000, damping: 60 },
                }}
                className="flex items-center"
              >
                <Badge
                  variant={isSelected ? "secondary" : "outline"}
                  className={`cursor-pointer flex items-center h-7 shrink-0 transition-colors duration-300 ease-in-out ${
                    tag.colorClass || ""
                  } ${
                    tag.colorClass
                      ? `hover:bg-opacity-80 hover:bg-${tag.colorClass}`
                      : "hover:bg-secondary"
                  } ${
                    shouldUseLightVariant(tag.colorClass ?? "")
                      ? "text-black"
                      : "text-white"
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
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Gradient Overlay */}
      {!showMoreTags && (
        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-r from-transparent via-background/100 to-background pointer-events-none" />
      )}

      {/* More/Less Button */}
      {(availableTags.length > INITIAL_TAGS_COUNT ||
        (!showMoreTags && sortedTags.length > INITIAL_TAGS_COUNT)) && (
        <Badge
          variant="outline"
          className={`cursor-pointer hover:bg-secondary flex items-center h-7 shrink-0 ${
            showMoreTags
              ? "absolute right-0 -bottom-8"
              : "absolute right-0 top-0 bg-background"
          }`}
          onClick={() => setShowMoreTags(!showMoreTags)}
        >
          {showMoreTags ? (
            <>
              Less <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              More <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Badge>
      )}
    </div>
  );
}

const tags: TagType[] = [
  { name: "React", colorClass: "bg-blue-500" },
  { name: "TypeScript", colorClass: "bg-blue-600" },
  { name: "JavaScript", colorClass: "bg-yellow-400" },
  { name: "Regular Tag" }, // Tags without colors still work
];
