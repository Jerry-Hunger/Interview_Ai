export * from "./system.js";
export * from "./interview.js";

export class PromptManager {
  constructor() {
    this._cache = new Map();
  }

  get(key) {
    return this._cache.get(key);
  }

  set(key, value) {
    this._cache.set(key, value);
  }

  has(key) {
    return this._cache.has(key);
  }

  clear() {
    this._cache.clear();
  }
}

export const promptManager = new PromptManager();
