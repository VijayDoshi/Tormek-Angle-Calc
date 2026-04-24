import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initNative(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#14110f" });
  } catch {
    /* status bar may not be available on all platforms */
  }
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
    /* splash may already be hidden */
  }
}
