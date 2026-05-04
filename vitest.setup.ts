// Global setup for the jsdom project. Loads @testing-library/jest-dom matchers
// and registers the cleanup hook so each test gets a fresh DOM.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
