// storage.ts
interface StoredItem<T> {
    value: T;
    expiry: number;
}

export const setWithExpiry = <T>(key: string, value: T, ttl: number): void => {
    const now = new Date();
    const item: StoredItem<T> = {
        value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = <T>(key: string): T | null => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }

    const item: StoredItem<T> = JSON.parse(itemStr);
    const now = new Date();

    // Check if the item has expired
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }

    return item.value;
};