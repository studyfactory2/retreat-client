import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { GuestAccessKind } from '../../../features/guest-entry/guest-entry.types';
import { GuestFrame } from './components/GuestFrame';
import { GuestHome } from './components/GuestHome';
import { GuestGuide } from './components/GuestGuide';
import { GuestAccessState } from './components/GuestAccessState';
import { useGuestEntry } from './hooks/use-guest-entry';
import {
  buildGuestViewLocation,
  readGuestAccess,
  readGuestView,
} from './model/guest-entry-model';
import './styles/guest-entry.css';

export function GuestEntryScreen({ kind }: { kind: GuestAccessKind }) {
  const location = useLocation();
  const access = readGuestAccess(location.hash);
  const view = readGuestView(location.search);
  const { resource, refresh } = useGuestEntry(
    kind, access.status === 'ready' ? access.token : null, view,
  );
  const main = useRef<HTMLElement>(null);
  const status = access.status === 'ready' ? resource.status : access.status;
  const ready = access.status === 'ready' && resource.status === 'ready';
  const home = buildGuestViewLocation(kind, location.hash, 'home');
  const guide = buildGuestViewLocation(kind, location.hash, 'guide');

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname, view, status]);

  return (
    <GuestFrame
      mainRef={main}
      view={view}
      home={home}
      guide={guide}
      ready={ready}
      refreshing={access.status === 'ready' && resource.status === 'loading'}
      onRefresh={access.status === 'ready' ? refresh : undefined}
    >
      {access.status !== 'ready' ? (
        <GuestAccessState kind={kind} state={access.status} />
      ) : resource.status === 'loading' ? (
        <GuestAccessState kind={kind} state="loading" />
      ) : resource.status === 'error' ? (
        <GuestAccessState
          kind={kind}
          state={resource.kind}
          message={resource.message}
          onRetry={refresh}
        />
      ) : view === 'guide' ? (
        resource.data.guide ? (
          <GuestGuide data={resource.data.guide} home={home} onRefresh={refresh} />
        ) : (
          <GuestAccessState kind={kind} state="request" onRetry={refresh} />
        )
      ) : (
        <GuestHome entry={resource.data.entry} guide={guide} />
      )}
    </GuestFrame>
  );
}
