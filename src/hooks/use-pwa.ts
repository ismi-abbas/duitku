import * as React from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function usePwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)")
    const updateInstalledState = () => {
      setIsInstalled(
        standalone.matches ||
          Boolean(
            (window.navigator as Navigator & { standalone?: boolean }).standalone
          )
      )
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    const updateOnlineState = () => {
      setIsOnline(navigator.onLine)
    }

    updateInstalledState()
    updateOnlineState()

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", updateOnlineState)
    window.addEventListener("offline", updateOnlineState)
    standalone.addEventListener("change", updateInstalledState)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", updateOnlineState)
      window.removeEventListener("offline", updateOnlineState)
      standalone.removeEventListener("change", updateInstalledState)
    }
  }, [])

  const installApp = React.useCallback(async () => {
    if (!deferredPrompt) {
      return false
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome === "accepted"
  }, [deferredPrompt])

  return {
    canInstall: Boolean(deferredPrompt),
    installApp,
    isInstalled,
    isOnline,
  }
}
