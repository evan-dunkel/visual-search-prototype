"use client";

import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery?: string;
}

export function TagSelector({
  availableTags: allTags,
  selectedTags,
  onTagToggle,
  searchQuery = "",
}: TagSelectorProps) {
  const [showMoreTags, setShowMoreTags] = useState(false);

  // Sort tags so selected ones appear first
  const sortedTags = [...allTags].sort((a, b) => {
    const aSelected = selectedTags.includes(a);
    const bSelected = selectedTags.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const getAvailableTags = () => {
    return allTags.filter(
      (tag) =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(searchQuery.toLowerCase())
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
            const isSelected = selectedTags.includes(tag);
            const isVisible =
              isSelected ||
              (!isSelected &&
                tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (showMoreTags ||
                  availableTags.indexOf(tag) < INITIAL_TAGS_COUNT));

            if (!isVisible) return null;

            return (
              <motion.div
                key={tag}
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 1000, damping: 60 },
                }}
                className="flex items-center"
              >
                <Badge
                  variant={isSelected ? "secondary" : "outline"}
                  className={`cursor-pointer ${
                    isSelected ? "hover:bg-secondary/80" : "hover:bg-secondary"
                  } flex items-center h-7 shrink-0 transition-colors duration-300 ease-in-out`}
                  onClick={() => onTagToggle(tag)}
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
                  {tag}
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
