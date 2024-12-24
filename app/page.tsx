"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { TagSelector, TagType } from "../components/tag-selector";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  getImages,
  ImageItem,
  getImageLists,
  ImageList,
} from "@/lib/pocketbase";
import { Loader2 } from "lucide-react";
import { AddToListButton } from "@/components/ui/add-to-list-button";

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

// Helper function to detect server connectivity issues
const isServerConnectivityError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  // Check the error message
  const errorMessage = error.message.toLowerCase();

  // Common fetch/network error patterns
  const networkErrorPatterns = [
    "failed to fetch",
    "network error",
    "network request failed",
    "econnrefused",
    "timeout",
    "abort",
    "not able to connect",
    "connection refused",
    "network offline",
    "no internet",
  ];

  // Check if it's a TypeError (common for network issues)
  if (
    error instanceof TypeError &&
    networkErrorPatterns.some((pattern) => errorMessage.includes(pattern))
  ) {
    return true;
  }

  // Check if it's a DOMException (e.g., AbortError)
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  // Check if it's a timeout error
  if (errorMessage.includes("timeout") || error.name === "TimeoutError") {
    return true;
  }

  // Check response status for server errors
  if ("status" in error && typeof error.status === "number") {
    // Server is down (503), gateway errors (502, 504), or no response
    return [0, 502, 503, 504].includes(error.status);
  }

  // Check for other common network error patterns
  return networkErrorPatterns.some((pattern) => errorMessage.includes(pattern));
};

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTagsOrder, setSelectedTagsOrder] = useState<
    Map<string, number>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [lists, setLists] = useState<ImageList[]>([]);
  const [selectedLists, setSelectedLists] = useState<ImageList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStableResults, setIsStableResults] = useState(false);
  const [showReducedOpacity, setShowReducedOpacity] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Control opacity and spinner visibility with delays
  useEffect(() => {
    if (error || !isStableResults) {
      setShowReducedOpacity(true);
      if (!error) {
        // Add delay before showing spinner
        const spinnerTimer = setTimeout(() => {
          setShowSpinner(true);
        }, 1000);

        return () => clearTimeout(spinnerTimer);
      }
    }
  }, [isStableResults, error]);

  useEffect(() => {
    const ATTEMPT_WINDOW = 5000; // 5 second window for all attempts
    const RETRY_DELAY = 1000; // 500ms between retries
    let isMounted = true;
    let attemptTimeoutId: NodeJS.Timeout;
    let retryTimeoutId: NodeJS.Timeout;

    const fetchData = async (attempt: number = 0): Promise<void> => {
      try {
        if (attempt === 0) {
          setIsStableResults(false);
        }

        const controller = new AbortController();
        const [fetchedImages, fetchedLists] = await Promise.all([
          getImages(debouncedSearchQuery, controller.signal),
          getImageLists(),
        ]);

        if (!isMounted) return;

        console.log("Fetched images:", fetchedImages);
        setImages(fetchedImages);
        setLists(fetchedLists);
        setError(null);
        setShowReducedOpacity(false);
        setShowSpinner(false);
        clearTimeout(attemptTimeoutId);
        setIsStableResults(true);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error in fetchData:", err);

        // Schedule next retry with delay, but only if we're still within the window
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed < ATTEMPT_WINDOW - RETRY_DELAY) {
          retryTimeoutId = setTimeout(() => {
            if (isMounted) {
              fetchData(attempt + 1);
            }
          }, RETRY_DELAY);
        } else {
          setError("Unable to connect to the server. Please try again.");
          setIsStableResults(true);
          setShowSpinner(false);
        }
      }
    };

    // Record start time for the attempt window
    const startTime = Date.now();

    // Start the fetch process
    fetchData();

    // Set a timeout for the entire attempt window
    attemptTimeoutId = setTimeout(() => {
      if (isMounted) {
        setError("Unable to connect to the server. Please try again.");
        setIsStableResults(true);
        setShowSpinner(false);
      }
    }, ATTEMPT_WINDOW);

    return () => {
      isMounted = false;
      clearTimeout(attemptTimeoutId);
      clearTimeout(retryTimeoutId);
    };
  }, [debouncedSearchQuery, selectedTags]);

  // Extract fetchImages logic to a reusable function
  const handleFetch = () => {
    setError(null);
    setIsStableResults(false);
    setShowReducedOpacity(true);
    setShowSpinner(true);

    // Force a re-run of the fetch effect
    setDebouncedSearchQuery((prev) => prev + " ");
  };

  // Filter images based on selected tags and list
  const filteredImages = useMemo(() => {
    let filtered = images;

    // First filter by lists if any are selected
    if (selectedLists.length > 0) {
      const selectedListIds = new Set(selectedLists.map((list) => list.id));
      filtered = filtered.filter((image) =>
        selectedLists.some((list) => list.images.includes(image.id))
      );
    }

    // Then filter by tags
    if (selectedTags.length === 0) return filtered;
    return filtered.filter((image) =>
      selectedTags.every((tag) => image.tags.includes(tag))
    );
  }, [images, selectedTags, selectedLists]);

  // Extract unique tags from loaded images and convert to TagType with colors
  const availableTags = useMemo(() => {
    // First, count occurrences of each tag
    const tagCounts = new Map<string, number>();

    // Add selected tags with count 0 if they don't exist in filtered images
    selectedTags.forEach((tag) => {
      if (!tagCounts.has(tag)) {
        tagCounts.set(tag, 0);
      }
    });

    // Then count occurrences from filtered images
    filteredImages.forEach((image) => {
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
    // 1. Selected tags first, ordered by selection time (most recent first)
    // 2. Unselected tags sorted by:
    //    a. Count (descending)
    //    b. Whether they have color
    //    c. Alphabetically
    return tags.sort((a, b) => {
      const aSelected = selectedTags.includes(a.name);
      const bSelected = selectedTags.includes(b.name);

      // If both are selected, sort by selection order (most recent first)
      if (aSelected && bSelected) {
        const aOrder = selectedTagsOrder.get(a.name) || 0;
        const bOrder = selectedTagsOrder.get(b.name) || 0;
        return bOrder - aOrder;
      }

      // If only one is selected
      if (aSelected !== bSelected) {
        return bSelected ? 1 : -1;
      }

      // For unselected tags, use the original sorting logic
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      if (!!a.colorClass !== !!b.colorClass) {
        return a.colorClass ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredImages, selectedTags, selectedTagsOrder]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
      // Remove from order tracking when deselected
      const newOrder = new Map(selectedTagsOrder);
      newOrder.delete(tagName);
      setSelectedTagsOrder(newOrder);
    } else {
      setSelectedTags([...selectedTags, tagName]);
      // Add to order tracking with current timestamp when selected
      const newOrder = new Map(selectedTagsOrder);
      newOrder.set(tagName, Date.now());
      setSelectedTagsOrder(newOrder);
    }
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)] p-2">
      <main className="flex flex-col row-start-2 items-center justify-center w-full max-w-3xl">
        <div className="w-full flex flex-col gap-2">
          <SearchInput
            placeholder={`Search ${
              selectedLists.length > 0
                ? selectedLists.length === 1
                  ? selectedLists[0].name
                  : `${selectedLists.length} lists`
                : "all images"
            }...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onCommaPress={(value) => {
              // Only add if it's not already in the selected tags
              if (!selectedTags.includes(value)) {
                setSelectedTags([value, ...selectedTags]);
                // Add to order tracking with current timestamp when selected
                const newOrder = new Map(selectedTagsOrder);
                newOrder.set(value, Date.now());
                setSelectedTagsOrder(newOrder);
              }
              setSearchQuery("");
            }}
            libraries={[
              {
                value: "",
                label: "All images",
              },
            ]}
            lists={lists.map((list) => ({
              value: list.id,
              label: list.name,
            }))}
            selectedLibrary={null}
            selectedLists={selectedLists.map((list) => list.id)}
            onLibraryChange={() => {
              // For now, we don't have library functionality
              // This can be implemented later
            }}
            onListsChange={(listIds) => {
              const selectedLists = listIds
                .map((id) => lists.find((l) => l.id === id))
                .filter((list): list is ImageList => list !== undefined);
              setSelectedLists(selectedLists);
            }}
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
          <div className="mt-6 flex flex-col items-center justify-center">
            <p className="text-red-500 text-center text-lg mb-4">{error}</p>
            <button
              onClick={handleFetch}
              className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-base font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {isStableResults && !error && filteredImages.length === 0 && (
          <div className="mt-6 text-center">
            No images found. Try a different search or add some images.
          </div>
        )}

        <div className="relative w-full">
          {showSpinner && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 h-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {!error && filteredImages.length > 0 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full transition-opacity duration-300 ${
                showReducedOpacity ? "opacity-50" : "opacity-100"
              }`}
            >
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="relative w-full h-[300px] overflow-hidden rounded-lg group"
                >
                  <Image
                    src={`http://127.0.0.1:8090/api/files/${image.collectionId}/${image.id}/${image.image}`}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <AddToListButton
                    imageId={image.id}
                    lists={lists}
                    onListsChange={() => {
                      // Refetch lists when changes occur
                      getImageLists().then(setLists);
                    }}
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
        </div>
      </main>
    </div>
  );
}
