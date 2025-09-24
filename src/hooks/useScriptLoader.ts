import { useState, useEffect, useCallback } from 'react';
import type { ScriptLoadState } from '../types';

/**
 * Custom hook to dynamically load external scripts
 * Handles loading state, caching, and error handling
 */
export const useScriptLoader = (src: string, id: string): ScriptLoadState => {
  const [state, setState] = useState<ScriptLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
  });

  const loadScript = useCallback(() => {
    // Check if script is already loaded
    if (document.getElementById(id)) {
      setState({ isLoading: false, isLoaded: true, error: null });
      return;
    }

    setState({ isLoading: true, isLoaded: false, error: null });

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;

    const onLoad = () => {
      setState({ isLoading: false, isLoaded: true, error: null });
    };

    const onError = () => {
      setState({
        isLoading: false,
        isLoaded: false,
        error: `Failed to load script: ${src}`,
      });
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      // Note: We don't remove the script from DOM to allow caching
    };
  }, [src, id]);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  return state;
};
