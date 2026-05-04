// Lightweight stand-ins. Components in scope don't directly call useRouter,
// but locale-toggle-action.ts uses next-intl's redirect under the hood.
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: async () => {},
});
export const usePathname = () => '/';
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({ locale: 'en' });
export const redirect = () => {};
export const notFound = () => {};
