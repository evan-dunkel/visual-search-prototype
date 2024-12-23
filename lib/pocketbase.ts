import PocketBase from "pocketbase";

// Initialize PocketBase client
export const pb = new PocketBase("http://127.0.0.1:8090");

// Try to restore auth if there is a valid session
if (typeof window !== "undefined") {
  pb.authStore.loadFromCookie(document?.cookie ?? "");
}

pb.authStore.onChange(() => {
  if (typeof window !== "undefined") {
    document.cookie = pb.authStore.exportToCookie();
  }
});

export type ImageItem = {
  id: string;
  title: string;
  tags: string[];
  image: string;
  collectionId: string;
};

// Helper function to get the images collection
export async function getImages(query = ""): Promise<ImageItem[]> {
  try {
    console.log("Fetching images with query:", query);
    const records = await pb.collection("images").getList(1, 50, {
      filter: query ? `title ~ "${query}" || tags ~ "${query}"` : "",
      sort: "-created",
    });

    console.log("Received records:", records);

    return records.items.map((record: any) => ({
      id: record.id,
      title: record.title,
      tags: Array.isArray(record.tags)
        ? record.tags
        : JSON.parse(record.tags || "[]"),
      image: record.image,
      collectionId: record.collectionId,
    }));
  } catch (error) {
    console.error("Error fetching images:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return [];
  }
}

// Helper function to upload an image
export async function uploadImage(
  file: File,
  metadata: {
    title: string;
    tags: string[];
  }
) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", metadata.title);
  formData.append("tags", JSON.stringify(metadata.tags));

  try {
    const record = await pb.collection("images").create(formData);
    return record;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}
