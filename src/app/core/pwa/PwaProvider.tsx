import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PwaContext } from './pwa-context';
import { watchPwaUpdates } from './register-pwa';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true);
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const prompt = useRef<InstallPromptEvent | null>(null);
  const busy = useRef(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);
  const [installing, setInstalling] = useState(false);
  const [installNotice, setInstallNotice] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [updateBuild, setUpdateBuild] = useState<string | null>(null);

  useEffect(() => {
    const available = (event: Event) => {
      if (!('prompt' in event) || typeof event.prompt !== 'function') return;
      event.preventDefault();
      prompt.current = event as InstallPromptEvent;
      setCanInstall(true);
      setInstallNotice('');
    };
    const completed = () => {
      prompt.current = null;
      setCanInstall(false);
      setInstalled(true);
      setInstallNotice('');
    };
    const connection = () => setOnline(navigator.onLine);
    const media = window.matchMedia('(display-mode: standalone)');
    const displayChanged = () => setInstalled(isStandalone());
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', completed);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    media.addEventListener('change', displayChanged);
    const stopUpdates = watchPwaUpdates(setUpdateBuild);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', completed);
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
      media.removeEventListener('change', displayChanged);
      stopUpdates();
    };
  }, []);

  const install = useCallback(async () => {
    const request = prompt.current;
    if (!request || busy.current) return;
    busy.current = true;
    prompt.current = null;
    setCanInstall(false);
    setInstalling(true);
    setInstallNotice('');
    try {
      // Called directly from the user's click to retain browser activation.
      await request.prompt();
      const choice = await request.userChoice;
      setInstallNotice(choice.outcome === 'accepted'
        ? '설치를 요청했어요. 기기의 앱 목록을 확인해 주세요.'
        : '설치를 취소했어요. 아래 안내로 나중에 다시 추가할 수 있어요.');
    } catch {
      setInstallNotice('설치 창을 열지 못했어요. 아래의 브라우저별 안내를 확인해 주세요.');
    } finally {
      busy.current = false;
      setInstalling(false);
    }
  }, []);

  return (
    <PwaContext.Provider value={{
      canInstall, installed, installing, installNotice, online, updateBuild, install,
    }}>
      {children}
    </PwaContext.Provider>
  );
}
