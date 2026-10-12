import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigationGuard } from '../../../core/router/navigation/use-navigation-guard';
import type { GuestAccessKind } from '../../../features/guest-entry/guest-entry.types';
import { GuestIssueScreen } from '../issues';
import { GuestFrame } from './components/GuestFrame';
import { GuestHome } from './components/GuestHome';
import { GuestGuide } from './components/GuestGuide';
import { GuestAccessState } from './components/GuestAccessState';
import { GuestStartForm } from './components/GuestStartForm';
import { GuestStayVehicleCard } from './components/GuestStayVehicleCard';
import { useGuestStayVehicle } from './hooks/use-guest-stay-vehicle';
import { useGuestStart } from './hooks/use-guest-start';
import { getGuestStartType } from './model/guest-start-model';
import { useGuestEntry } from './hooks/use-guest-entry';
import {
  buildGuestViewLocation,
  readGuestAccess,
  readGuestView,
} from './model/guest-entry-model';
import './styles/guest-entry.css';
import './styles/guest-start.css';
import './styles/guest-stay-vehicle.css';

export function GuestEntryScreen({ kind }: { kind: GuestAccessKind }) {
  const location = useLocation();
  return kind === 'qr' && readGuestView(location.search) === 'report' ? (
    <GuestIssueScreen />
  ) : (
    <GuestEntrySessionScreen kind={kind} />
  );
}

function GuestEntrySessionScreen({ kind }: { kind: GuestAccessKind }) {
  const location = useLocation();
  const access = readGuestAccess(location.hash);
  const requestedView = readGuestView(location.search);
  const view = requestedView === 'report' ? 'home' : requestedView;
  const { resource, refresh, rejectAccess } = useGuestEntry(
    kind,
    access.status === 'ready' ? access.token : null,
    view,
  );
  const vehicleForm = useGuestStayVehicle(
    kind === 'stay' && view === 'home' && access.status === 'ready'
      ? access.token
      : null,
    resource.status === 'ready' && resource.data.entry.kind === 'stay'
      ? resource.data.entry.context
      : null,
    resource.status === 'ready'
      ? 'ready'
      : resource.status === 'loading'
        ? 'checking'
        : resource.kind === 'unavailable'
          ? 'denied'
          : 'error',
    rejectAccess,
  );
  const startType = getGuestStartType(view);
  const startForm = useGuestStart(
    kind,
    access.status === 'ready' ? access.token : null,
    startType,
    resource.status === 'ready' ? resource.data.entry : null,
    refresh,
  );
  useNavigationGuard(startForm.hasPendingWork);
  useNavigationGuard(vehicleForm.hasPendingWork);
  const main = useRef<HTMLElement>(null);
  const denied = startType !== null && startForm.state.status === 'denied';
  const status =
    access.status !== 'ready'
      ? access.status
      : denied
        ? 'unavailable'
        : resource.status;
  const ready =
    access.status === 'ready' && !denied && resource.status === 'ready';
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
      report={
        kind === 'qr'
          ? buildGuestViewLocation(kind, location.hash, 'report')
          : undefined
      }
      ready={ready}
      refreshing={
        !denied &&
        (startForm.pending ||
          (access.status === 'ready' && resource.status === 'loading'))
      }
      onRefresh={
        access.status === 'ready' && !denied && !startForm.pending
          ? refresh
          : undefined
      }
    >
      {access.status !== 'ready' ? (
        <GuestAccessState kind={kind} state={access.status} />
      ) : denied ? (
        <GuestAccessState
          kind={kind}
          state="unavailable"
          message={startForm.state.message}
        />
      ) : resource.status === 'loading' ? (
        <GuestAccessState kind={kind} state="loading" />
      ) : resource.status === 'error' ? (
        <GuestAccessState
          kind={kind}
          state={resource.kind}
          message={resource.message}
          onRetry={refresh}
        />
      ) : startType ? (
        <GuestStartForm
          entry={resource.data.entry}
          type={startType}
          home={home}
          form={startForm}
        />
      ) : view === 'guide' ? (
        resource.data.guide ? (
          <GuestGuide
            data={resource.data.guide}
            home={home}
            onRefresh={refresh}
          />
        ) : (
          <GuestAccessState kind={kind} state="request" onRetry={refresh} />
        )
      ) : (
        <GuestHome
          entry={resource.data.entry}
          guide={guide}
          report={
            kind === 'qr'
              ? buildGuestViewLocation(kind, location.hash, 'report')
              : undefined
          }
          checkIn={buildGuestViewLocation(kind, location.hash, 'check-in')}
          checkOut={buildGuestViewLocation(kind, location.hash, 'check-out')}
          vehicleCard={<GuestStayVehicleCard form={vehicleForm} />}
        />
      )}
    </GuestFrame>
  );
}
