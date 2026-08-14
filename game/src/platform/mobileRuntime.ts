export type MobileRuntimeProfile = Readonly<{
  nativeShell: boolean;
  touchOptimized: boolean;
  portrait: boolean;
  autoAim: boolean;
}>;

type RuntimeWindow = Window & typeof globalThis & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

export function detectMobileRuntime(environment: RuntimeWindow = window): MobileRuntimeProfile {
  const nativeShell = Boolean(environment.Capacitor?.isNativePlatform?.());
  const touchPoints = Math.max(0, Number(environment.navigator?.maxTouchPoints) || 0);
  const coarsePointer = Boolean(environment.matchMedia?.("(pointer: coarse)")?.matches);
  const portrait = Boolean(environment.matchMedia?.("(orientation: portrait)")?.matches);
  const touchOptimized = nativeShell || touchPoints > 0 || coarsePointer;

  return Object.freeze({
    nativeShell,
    touchOptimized,
    portrait,
    autoAim: touchOptimized && portrait,
  });
}
