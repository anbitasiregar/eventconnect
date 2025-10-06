"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExtensionStorage = void 0;
const react_1 = require("react");
const useExtensionStorage = (key, defaultValue) => {
    const [value, setValue] = (0, react_1.useState)(defaultValue || null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const loadValue = (0, react_1.useCallback)(async () => {
        try {
            setIsLoading(true);
            const result = await chrome.storage.local.get([key]);
            setValue(result[key] ?? defaultValue ?? null);
        }
        catch (error) {
            console.error(`Failed to load storage value for key ${key}:`, error);
            setValue(defaultValue ?? null);
        }
        finally {
            setIsLoading(false);
        }
    }, [key, defaultValue]);
    const updateValue = (0, react_1.useCallback)(async (newValue) => {
        try {
            await chrome.storage.local.set({ [key]: newValue });
            setValue(newValue);
        }
        catch (error) {
            console.error(`Failed to update storage value for key ${key}:`, error);
            throw new Error(`Failed to save ${key}`);
        }
    }, [key]);
    // Load value on mount and when key changes
    (0, react_1.useEffect)(() => {
        loadValue();
    }, [loadValue]);
    // Listen for storage changes
    (0, react_1.useEffect)(() => {
        const handleStorageChange = (changes) => {
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
exports.useExtensionStorage = useExtensionStorage;
//# sourceMappingURL=useExtensionStorage.js.map