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

export type ImageList = {
  id: string;
  name: string;
  description?: string;
  images: string[]; // Array of image IDs
  created: string;
  updated: string;
};

// Helper function to get the images collection
export async function getImages(
  query = "",
  signal?: AbortSignal
): Promise<ImageItem[]> {
  try {
    console.log("Fetching images with query:", query);
    const records = await pb.collection("images").getList(1, 50, {
      filter: query ? `title ~ "${query}" || tags ~ "${query}"` : "",
      sort: "-created",
      signal,
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
      // Rethrow the error to handle it in the component
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching images");
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

// Helper function to get all image lists
export async function getImageLists(): Promise<ImageList[]> {
  try {
    const records = await pb.collection("image_lists").getList(1, 50, {
      sort: "-created",
    });

    return records.items.map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      images: record.images,
      created: record.created,
      updated: record.updated,
    }));
  } catch (error) {
    console.error("Error fetching image lists:", error);
    throw error;
  }
}

// Helper function to create a new image list
export async function createImageList(data: {
  name: string;
  description?: string;
}): Promise<ImageList> {
  try {
    const record = await pb.collection("image_lists").create({
      name: data.name,
      description: data.description,
      images: [],
    });

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      images: record.images || [],
      created: record.created,
      updated: record.updated,
    };
  } catch (error) {
    console.error("Error creating image list:", error);
    throw error;
  }
}

// Helper function to add an image to a list
export async function addImageToList(
  listId: string,
  imageId: string
): Promise<void> {
  try {
    const list = await pb.collection("image_lists").getOne(listId);
    const images = Array.isArray(list.images) ? list.images : [];

    if (!images.includes(imageId)) {
      await pb.collection("image_lists").update(listId, {
        images: [...images, imageId],
      });
    }
  } catch (error) {
    console.error("Error adding image to list:", error);
    throw error;
  }
}

// Helper function to remove an image from a list
export async function removeImageFromList(
  listId: string,
  imageId: string
): Promise<void> {
  try {
    const list = await pb.collection("image_lists").getOne(listId);
    const images = Array.isArray(list.images) ? list.images : [];

    await pb.collection("image_lists").update(listId, {
      images: images.filter((id) => id !== imageId),
    });
  } catch (error) {
    console.error("Error removing image from list:", error);
    throw error;
  }
}
