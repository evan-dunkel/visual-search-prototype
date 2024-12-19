"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { TagSelector } from "../components/tag-selector";
import { sampleTags } from "@/data/sample-tags";

// Define our image data type
type ImageItem = {
  id: string;
  title: string;
  tags: string[];
  src: string;
};

// Sample data - you would replace this with your actual data
const SAMPLE_IMAGES: ImageItem[] = [
  {
    id: "1",
    title: "Blue denim dress",
    tags: ["dress", "denim", "blue", "casual"],
    src: "/images/denim-dress.jpg",
  },
  // Add more sample images here
];

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)] p-2">
      <main className="flex flex-col gap-2 row-start-2 items-center justify-center w-full max-w-3xl">
        <Tabs defaultValue="library" className="text-sm font-bold">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full">
          <Input
            placeholder="Search for images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <TagSelector
            availableTags={sampleTags}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            searchQuery={searchQuery}
          />
        </div>

        {/* Image Grid would go here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {/* Add your image components here */}
        </div>
      </main>
    </div>
  );
}
