"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type State = { pos: number; total: number } | null;
type Controls = { prev: () => void; next: () => void };
type InfoState = { visible: boolean } | null;
type InfoControls = { toggle: () => void };
/** Per-slide title + description for meta-carousel pages — bridged
 *  from `MetaCarousel`'s internal active-slide state to `ProjectNav`
 *  so the slide-out title chip can show the active piece's title
 *  ("Lissajous", "Wave", …) instead of the static meta project name
 *  ("Animations"). Null when no meta carousel is mounted. */
type ActiveSlide = { title: string; description: string } | null;

type ContextValue = {
  state: State;
  setState: (s: State) => void;
  controlsRef: RefObject<Controls | null>;
  infoState: InfoState;
  setInfoState: (s: InfoState) => void;
  infoControlsRef: RefObject<InfoControls | null>;
  activeSlide: ActiveSlide;
  setActiveSlide: (s: ActiveSlide) => void;
};

const noopRef: RefObject<Controls | null> = { current: null };
const noopInfoRef: RefObject<InfoControls | null> = { current: null };

const CarouselStateContext = createContext<ContextValue>({
  state: null,
  setState: () => {},
  controlsRef: noopRef,
  infoState: null,
  setInfoState: () => {},
  infoControlsRef: noopInfoRef,
  activeSlide: null,
  setActiveSlide: () => {},
});

export function CarouselStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null);
  const controlsRef = useRef<Controls | null>(null);
  const [infoState, setInfoState] = useState<InfoState>(null);
  const infoControlsRef = useRef<InfoControls | null>(null);
  const [activeSlide, setActiveSlide] = useState<ActiveSlide>(null);
  return (
    <CarouselStateContext.Provider
      value={{
        state,
        setState,
        controlsRef,
        infoState,
        setInfoState,
        infoControlsRef,
        activeSlide,
        setActiveSlide,
      }}
    >
      {children}
    </CarouselStateContext.Provider>
  );
}

export function useCarouselState() {
  return useContext(CarouselStateContext);
}

// Helper for any slide/component that has a togglable info panel: pushes
// {visible} on every change and registers a toggle handler so ProjectNav can
// render an "i" button in the title row.
export function useReportInfoState(visible: boolean, toggle: () => void) {
  const { setInfoState, infoControlsRef } = useContext(CarouselStateContext);
  const stableSetInfoState = useCallback(setInfoState, [setInfoState]);

  useEffect(() => {
    stableSetInfoState({ visible });
  }, [visible, stableSetInfoState]);

  useEffect(() => {
    infoControlsRef.current = { toggle };
    return () => {
      infoControlsRef.current = null;
    };
  });

  useEffect(() => {
    return () => stableSetInfoState(null);
  }, [stableSetInfoState]);
}

// Helper for carousels: pushes {pos, total} on every change and clears on
// unmount. Optional prev/next register the carousel's navigation handlers
// so ProjectNav can drive it from the title-row caret buttons.
export function useReportCarouselState(
  pos: number,
  total: number,
  prev?: () => void,
  next?: () => void,
) {
  const { setState, controlsRef } = useContext(CarouselStateContext);
  const stableSetState = useCallback(setState, [setState]);

  useEffect(() => {
    stableSetState({ pos, total });
  }, [pos, total, stableSetState]);

  // Keep the latest prev/next on the ref every render so click handlers
  // always call the current closures (which capture current state).
  useEffect(() => {
    if (prev && next) {
      controlsRef.current = { prev, next };
    }
    return () => {
      controlsRef.current = null;
    };
  });

  useEffect(() => {
    return () => stableSetState(null);
  }, [stableSetState]);
}
