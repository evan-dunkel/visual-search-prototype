"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { TagSelector } from "../components/tag-selector";
import { sampleTags } from "@/data/sample-tags";
import { SearchInput } from "@/components/ui/SearchInput";
import { getImages, ImageItem } from "@/lib/pocketbase";

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const fetchedImages = await getImages(searchQuery);
      setImages(fetchedImages);
    };

    fetchImages();
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

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
              availableTags={sampleTags}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={`http://127.0.0.1:8090/api/files/${image.collectionId}/${image.id}/${image.image}`}
                alt={image.title}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <h3 className="text-sm font-medium">{image.title}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {image.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-white bg-opacity-20 rounded px-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
