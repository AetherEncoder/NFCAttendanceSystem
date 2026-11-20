import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NfcManager, { NfcAdapter, NfcEvents, type TagEvent } from 'react-native-nfc-manager';

export type NfcStatus = 'starting' | 'ready' | 'paused' | 'disabled' | 'unsupported' | 'error';

export function useNfc(onTag: (tag: TagEvent) => void, paused: boolean) {
  const [status, setStatus] = useState<NfcStatus>('starting');
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [attempt, setAttempt] = useState(0);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    const enqueue = (operation: () => Promise<void>) => {
      queue.current = queue.current.catch(() => {}).then(operation);
    };

    enqueue(async () => {
      if (!active) return;
      if (paused || !foreground) {
        setStatus('paused');
        return;
      }
      setStatus('starting');
      try {
        if (!(await NfcManager.isSupported())) {
          if (active) setStatus('unsupported');
          return;
        }
        await NfcManager.start();
        if (!(await NfcManager.isEnabled())) {
          if (active) setStatus('disabled');
          return;
        }
        if (!active) return;
        NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
          if (active) onTag(tag);
        });
        NfcManager.setEventListener(NfcEvents.StateChanged, ({ state }) => {
          if (active && state !== 'on') setStatus('disabled');
          if (active && state === 'on') setAttempt((value) => value + 1);
        });
        await NfcManager.registerTagEvent({
          isReaderModeEnabled: true,
          readerModeFlags: NfcAdapter.FLAG_READER_NFC_A |
            NfcAdapter.FLAG_READER_NFC_B |
            NfcAdapter.FLAG_READER_NFC_F |
            NfcAdapter.FLAG_READER_NFC_V |
            NfcAdapter.FLAG_READER_NFC_BARCODE |
            NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK |
            NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
          readerModeDelay: 250,
        });
        if (active) setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    });

    return () => {
      active = false;
      enqueue(async () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
        await NfcManager.unregisterTagEvent().catch(() => {});
      });
    };
  }, [paused, foreground, attempt, onTag]);

  return { status, retry: () => setAttempt((value) => value + 1) };
}
