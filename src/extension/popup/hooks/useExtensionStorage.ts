import { useState, useEffect, useCallback } from 'react';

export const useExtensionStorage = <T>(
  key: string,
  defaultValue?: T
): [T | null, (value: T) => Promise<void>, boolean] => {
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [isLoading, setIsLoading] = useState(true);

  const loadValue = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get([key]);
      setValue(result[key] ?? defaultValue ?? null);
    } catch (error) {
      console.error(`Failed to load storage value for key ${key}:`, error);
      setValue(defaultValue ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  const updateValue = useCallback(async (newValue: T) => {
    try {
      await chrome.storage.local.set({ [key]: newValue });
      setValue(newValue);
    } catch (error) {
      console.error(`Failed to update storage value for key ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }, [key]);

  // Load value on mount and when key changes
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[key]) {
        setValue(changes[key].newValue ?? defaultValue ?? null);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key, defaultValue]);

  return [value, updateValue, isLoading];
};
