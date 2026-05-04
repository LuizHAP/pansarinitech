// Global setup for the jsdom project. Loads @testing-library/jest-dom matchers
// and registers the cleanup hook so each test gets a fresh DOM.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does not implement window.matchMedia — next-themes calls it on mount.
// Provide a minimal stub that always returns false for any media query.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom does not implement IntersectionObserver — motion/react's RevealGroup uses
// it for viewport-triggered animations. Provide a no-op stub so components render.
const IntersectionObserverMock = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

afterEach(() => {
  cleanup();
});
