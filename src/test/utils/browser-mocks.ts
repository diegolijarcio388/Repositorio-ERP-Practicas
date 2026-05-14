class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

export const installWindowLocalStorageMock = (): void => {
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: new MemoryStorage(),
    },
    writable: true,
    configurable: true,
  });
};

export const removeWindowMock = (): void => {
  delete (globalThis as { window?: unknown }).window;
};
