"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { TagSelector, TagType } from "../components/tag-selector";
import { SearchInput } from "@/components/ui/SearchInput";
import { getImages, ImageItem } from "@/lib/pocketbase";

// Color mapping for known color words with text color information
const COLOR_MAPPINGS: Record<string, { bg: string; text: string }> = {
  red: { bg: "bg-red-500", text: "text-white" },
  blue: { bg: "bg-blue-500", text: "text-white" },
  green: { bg: "bg-green-500", text: "text-white" },
  yellow: { bg: "bg-yellow-500", text: "text-black" },
  purple: { bg: "bg-purple-500", text: "text-white" },
  pink: { bg: "bg-pink-500", text: "text-white" },
  orange: { bg: "bg-orange-500", text: "text-white" },
  brown: { bg: "bg-amber-700", text: "text-white" },
  gray: { bg: "bg-gray-500", text: "text-white" },
  grey: { bg: "bg-gray-500", text: "text-white" },
  black: { bg: "bg-black", text: "text-white" },
  white: { bg: "bg-white", text: "text-black" },
  navy: { bg: "bg-blue-900", text: "text-white" },
  teal: { bg: "bg-teal-500", text: "text-white" },
  cyan: { bg: "bg-cyan-500", text: "text-black" },
  indigo: { bg: "bg-indigo-500", text: "text-white" },
  violet: { bg: "bg-violet-500", text: "text-white" },
  maroon: { bg: "bg-red-900", text: "text-white" },
  beige: { bg: "bg-[#F5F5DC]", text: "text-black" },
  tan: { bg: "bg-[#D2B48C]", text: "text-black" },
  gold: { bg: "bg-yellow-600", text: "text-white" },
  silver: { bg: "bg-gray-300", text: "text-black" },
  bronze: { bg: "bg-amber-600", text: "text-white" },
};

// Helper function to detect color in a tag
const getColorForTag = (
  tag: string
): { bg: string; text: string } | undefined => {
  const lowercaseTag = tag.toLowerCase();
  // Check if the tag itself is a color
  if (COLOR_MAPPINGS[lowercaseTag]) {
    return COLOR_MAPPINGS[lowercaseTag];
  }
  // Check if the tag contains a color word
  for (const [color, classes] of Object.entries(COLOR_MAPPINGS)) {
    if (lowercaseTag.includes(color)) {
      return classes;
    }
  }
  return undefined;
};

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStableResults, setIsStableResults] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsStableResults(false);
        const fetchedImages = await getImages(debouncedSearchQuery);
        console.log("Fetched images:", fetchedImages);
        setImages(fetchedImages);
        // Add a small delay before showing stable results
        setTimeout(() => {
          setIsStableResults(true);
        }, 300);
      } catch (err) {
        console.error("Error in fetchImages:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch images");
        setIsStableResults(true);
      }
    };

    fetchImages();
  }, [debouncedSearchQuery, selectedTags]);

  // Extract unique tags from loaded images and convert to TagType with colors
  const availableTags = useMemo(() => {
    // First, count occurrences of each tag
    const tagCounts = new Map<string, number>();
    images.forEach((image) => {
      image.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to TagType array with counts and colors
    const tags = Array.from(tagCounts.entries()).map(([tag, count]) => {
      const colorInfo = getColorForTag(tag);
      return {
        name: tag,
        count,
        ...(colorInfo && {
          colorClass: `${colorInfo.bg} ${colorInfo.text}`,
        }),
      };
    });

    // Sort tags:
    // 1. By count (descending)
    // 2. Then by whether they have color
    // 3. Then alphabetically
    return tags.sort((a, b) => {
      // First, sort by count
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      // If counts are equal, check for colors
      if (!!a.colorClass !== !!b.colorClass) {
        return a.colorClass ? -1 : 1;
      }
      // If color status is the same, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [images]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Filter images based on selected tags
  const filteredImages = useMemo(() => {
    if (selectedTags.length === 0) return images;
    return images.filter((image) =>
      selectedTags.every((tag) => image.tags.includes(tag))
    );
  }, [images, selectedTags]);

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)] p-2">
      <main className="flex flex-col row-start-2 items-center justify-center w-full max-w-3xl">
        <div className="w-full flex flex-col gap-2">
          <SearchInput
            placeholder="Search for images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            comboOptions={[
              {
                value: "rashti-library",
                label: "All libraries",
              },
              {
                value: "inspiration",
                label: "Inspiration",
              },
            ]}
          />

          <div className="flex flex-row flex-wrap items-center gap-2 min-h-[2.25rem]">
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 text-red-500 text-center">Error: {error}</div>
        )}

        {isStableResults && !error && filteredImages.length === 0 && (
          <div className="mt-6 text-center">
            No images found. Try a different search or add some images.
          </div>
        )}

        {!error && filteredImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="relative w-full aspect-square overflow-hidden rounded-lg h-[300px]"
              >
                <Image
                  src={`http://127.0.0.1:8090/api/files/${image.collectionId}/${image.id}/${image.image}`}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  <h3 className="text-sm font-medium">{image.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {image.tags.map((tag) => {
                      const colorInfo = getColorForTag(tag);
                      return (
                        <span
                          key={tag}
                          className={`text-xs rounded px-1 ${
                            colorInfo
                              ? `${colorInfo.bg} ${colorInfo.text}`
                              : "bg-white bg-opacity-20 text-white"
                          }`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
