import { useEffect, type RefObject } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToTop(ref: RefObject<HTMLDivElement | null>) {
  const { pathname } = useLocation();

  useEffect(() => {
    ref.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, ref]);
}
