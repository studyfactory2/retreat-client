import { useEffect, useRef, useState } from 'react'
import type { RetreatSceneController } from '../scene/createRetreatScene'
import './retreat-scene.css'

type SceneState = 'loading' | 'ready' | 'fallback'
type SceneMount = HTMLDivElement & { __retreatScene?: RetreatSceneController }
type ControlIconName = 'left' | 'right' | 'pause' | 'play' | 'reset'

function ControlIcon({ name }: { name: ControlIconName }) {
  const paths: Record<ControlIconName, string> = {
    left: 'm14 6-6 6 6 6',
    right: 'm10 6 6 6-6 6',
    pause: 'M9 6v12M15 6v12',
    play: 'm9 5 11 7-11 7Z',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

export function RetreatScene() {
  const mountRef = useRef<SceneMount>(null)
  const controllerRef = useRef<RetreatSceneController | null>(null)
  const [sceneState, setSceneState] = useState<SceneState>('loading')
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let alive = true
    let controller: RetreatSceneController | null = null
    const mobileQuery = window.matchMedia('(max-width: 650px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)

    const onMobileChange = () => controller?.setMobile(mobileQuery.matches)
    const onMotionChange = () => {
      setReducedMotion(motionQuery.matches)
      controller?.setReducedMotion(motionQuery.matches)
    }
    mobileQuery.addEventListener('change', onMobileChange)
    motionQuery.addEventListener('change', onMotionChange)

    // The rest of the application never needs to load the 3D engine.
    void import('../scene/createRetreatScene').then(({ createRetreatScene }) => {
      if (!alive) return
      controller = createRetreatScene(mount, {
        mobile: mobileQuery.matches,
        reducedMotion: motionQuery.matches,
        onReady: () => { if (alive) setSceneState('ready') },
        onError: () => { if (alive) setSceneState('fallback') },
      })
      controller.setPaused(pausedRef.current)
      controllerRef.current = controller
      if (import.meta.env.DEV) mount.__retreatScene = controller
    }).catch(() => {
      if (!alive) return
      controller?.dispose()
      setSceneState('fallback')
    })

    return () => {
      alive = false
      mobileQuery.removeEventListener('change', onMobileChange)
      motionQuery.removeEventListener('change', onMotionChange)
      controller?.dispose()
      controllerRef.current = null
      delete mount.__retreatScene
    }
  }, [])

  function togglePaused() {
    const next = !pausedRef.current
    pausedRef.current = next
    setPaused(next)
    controllerRef.current?.setPaused(next)
  }

  const ready = sceneState === 'ready'
  const motionLabel = reducedMotion ? '동작 줄이기 설정 사용 중' : paused ? '자동 회전 시작' : '자동 회전 멈추기'
  return (
    <figure className="retreat-scene" data-state={sceneState} aria-label="정원이 있는 휴양소와 가족의 3D 미리보기">
      <div className="retreat-scene__viewport">
        <div className="retreat-scene__glow" aria-hidden="true" />
        <img className="retreat-scene__poster" src="/landing/retreat-poster.png" alt="" width="900" height="760" aria-hidden="true" />
        <div className="retreat-scene__mount" ref={mountRef} />
      </div>
      <figcaption className="retreat-scene__caption">
        <span>{sceneState === 'fallback' ? '휴양소 미리보기' : '휴양소 둘러보기'}</span>
        <div className="retreat-scene__controls" role="group" aria-label="휴양소 회전 조절">
          <button type="button" aria-label="왼쪽으로 회전" disabled={!ready} onClick={() => controllerRef.current?.rotate(-0.24)}><ControlIcon name="left" /></button>
          <button type="button" aria-label={motionLabel} title={motionLabel} disabled={!ready || reducedMotion} onClick={togglePaused}><ControlIcon name={paused || reducedMotion ? 'play' : 'pause'} /></button>
          <button type="button" aria-label="처음 방향으로" disabled={!ready} onClick={() => controllerRef.current?.reset()}><ControlIcon name="reset" /></button>
          <button type="button" aria-label="오른쪽으로 회전" disabled={!ready} onClick={() => controllerRef.current?.rotate(0.24)}><ControlIcon name="right" /></button>
        </div>
      </figcaption>
    </figure>
  )
}
