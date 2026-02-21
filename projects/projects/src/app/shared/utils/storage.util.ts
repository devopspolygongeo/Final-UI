export const StorageUtil = {
    clearStorage: () => {
        localStorage.clear();
    },
    setItem: (key: string, value: string): void => {
        localStorage.setItem(key, value);
    },
    getItem: (key: string): string  | null => {
        return localStorage.getItem(key);
    }
}