import PocketBase from "pocketbase";

// Initialize PocketBase client
export const pb = new PocketBase("http://127.0.0.1:8090");

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
    const records = await pb.collection("images").getList(1, 50, {
      filter: query ? `title ~ "${query}" || tags ~ "${query}"` : "",
      sort: "-created",
    });

    return records.items.map((record) => ({
      id: record.id,
      title: record.title,
      tags: record.tags,
      image: record.image,
      collectionId: record.collectionId,
    }));
  } catch (error) {
    console.error("Error fetching images:", error);
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
