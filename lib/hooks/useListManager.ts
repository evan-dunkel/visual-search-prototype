import { useState, useCallback } from "react";
import {
  getImageLists,
  createImageList,
  updateImageList,
  deleteImageList,
  addImageToList,
  removeImageFromList,
  ImageList,
} from "@/lib/pocketbase";

export function useListManager() {
  const [lists, setLists] = useState<ImageList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedLists = await getImageLists();
      setLists(updatedLists);
      return updatedLists;
    } catch (error) {
      console.error("Error fetching lists:", error);
      setError("Failed to fetch lists");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new list
  const createList = useCallback(
    async (name: string, description?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await createImageList({ name, description });
        await fetchLists();
      } catch (error) {
        console.error("Error creating list:", error);
        setError("Failed to create list");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLists]
  );

  // Update a list
  const updateList = useCallback(
    async (listId: string, name: string, description?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await updateImageList(listId, { name, description });
        await fetchLists();
      } catch (error) {
        console.error("Error updating list:", error);
        setError("Failed to update list");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLists]
  );

  // Delete a list
  const deleteList = useCallback(
    async (listId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await deleteImageList(listId);
        await fetchLists();
      } catch (error) {
        console.error("Error deleting list:", error);
        setError("Failed to delete list");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLists]
  );

  // Add image to list
  const addToList = useCallback(
    async (listId: string, imageId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await addImageToList(listId, imageId);
        await fetchLists();
      } catch (error) {
        console.error("Error adding image to list:", error);
        setError("Failed to add image to list");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLists]
  );

  // Remove image from list
  const removeFromList = useCallback(
    async (listId: string, imageId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await removeImageFromList(listId, imageId);
        await fetchLists();
      } catch (error) {
        console.error("Error removing image from list:", error);
        setError("Failed to remove image from list");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLists]
  );

  return {
    lists,
    isLoading,
    error,
    fetchLists,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
  };
}
