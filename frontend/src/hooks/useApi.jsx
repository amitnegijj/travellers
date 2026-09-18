import { useEffect, useRef, useState } from "react";

/**
 * Runs an async fetch on mount and whenever `deps` change, tracking
 * {data, loading, error}. Stands in for the data-fetching half of what used
 * to be an `async function Page()` server component — the JSX below reads
 * the same three states a Suspense boundary + error boundary used to give it
 * for free, just tracked explicitly.
 *
 * `fetcher` receives an AbortSignal that fires when deps change again or the
 * component unmounts, so a slow, superseded request can't clobber a newer one.
 */
export function useApi(fetcher, deps) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(fetcherRef.current(controller.signal))
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (alive && error?.name !== "AbortError") setState({ data: undefined, loading: false, error });
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
