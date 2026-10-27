import { beforeEach, expect, it, vi } from 'vitest'
import {
  ENV,
  LEAF_ID,
  NOW,
  WT,
  makeSnapshot,
  makeState,
  resetWebSessionTabsSyncTestState
} from '../web-session-tabs-sync-test-harness'
import { applyWebSessionTabsSnapshot, applyWebSessionTabsSnapshots } from './snapshot-api'
import { toWebTerminalSurfaceTabId } from '../../../../shared/terminal-surface-id'
import {
  resetFrameDrawnServerWorkspacesForTests,
  setFrameDrawnServerWorkspaces
} from './frame-drawn-server-workspaces'
import { VISIBILITY_INVENTORY_REMOVAL_EPOCH } from './state'

const switches = vi.hoisted(() => ({ layoutOwnerIsMain: false }))
vi.mock('../../../../shared/layout-owner-switch', () => ({
  get ORCA_LAYOUT_OWNER_IS_MAIN() {
    return switches.layoutOwnerIsMain
  }
}))
vi.mock('../../store', () => ({ useAppStore: { setState: vi.fn() } }))

beforeEach(() => {
  switches.layoutOwnerIsMain = false
  resetWebSessionTabsSyncTestState()
  resetFrameDrawnServerWorkspacesForTests()
})

function surface(hostTabId = 'host-tab-1') {
  return {
    type: 'terminal' as const,
    id: `${hostTabId}::${LEAF_ID}`,
    parentTabId: hostTabId,
    leafId: LEAF_ID,
    title: 'terminal',
    isActive: true,
    status: 'ready' as const,
    terminal: `pty-${hostTabId}`
  }
}

function seed(frameDrawn: boolean) {
  const initial = makeState()
  const state = {
    ...initial,
    ...applyWebSessionTabsSnapshot(initial, makeSnapshot([surface()]), ENV, NOW)
  }
  const tabId = toWebTerminalSurfaceTabId('host-tab-1')
  expect(state.tabsByWorktree[WT]?.map((tab) => tab.id)).toContain(tabId)
  if (frameDrawn) {
    switches.layoutOwnerIsMain = true
    setFrameDrawnServerWorkspaces(ENV, new Set([WT]))
  }
  return { ...state, notificationMutedTabIds: { [tabId]: true as const, unrelated: true as const } }
}

it.each([false, true])(
  'clears a confirmed remote close before the same tab is reopened (frames: %s)',
  (frameDrawn) => {
    const state = seed(frameDrawn)
    const closed = {
      ...state,
      ...applyWebSessionTabsSnapshot(state, makeSnapshot([], { snapshotVersion: 2 }), ENV, NOW)
    }
    expect(closed.notificationMutedTabIds).toEqual({ unrelated: true })
    expect(state.notificationMutedTabIds[toWebTerminalSurfaceTabId('host-tab-1')]).toBe(true)
    const reopened = {
      ...closed,
      ...applyWebSessionTabsSnapshot(
        closed,
        makeSnapshot([surface()], { snapshotVersion: 3 }),
        ENV,
        NOW
      )
    }
    expect(reopened.notificationMutedTabIds).toEqual({ unrelated: true })
  }
)

it.each([false, true])(
  'preserves silence when a workspace becomes unavailable without a tab close (frames: %s)',
  (frameDrawn) => {
    const state = seed(frameDrawn)
    const unavailable = {
      ...state,
      ...applyWebSessionTabsSnapshot(
        state,
        makeSnapshot([], {
          publicationEpoch: VISIBILITY_INVENTORY_REMOVAL_EPOCH,
          snapshotVersion: 2
        }),
        ENV,
        NOW
      )
    }
    expect(unavailable.notificationMutedTabIds).toBe(state.notificationMutedTabIds)
    const restored = {
      ...unavailable,
      ...applyWebSessionTabsSnapshot(
        unavailable,
        makeSnapshot([surface()], { snapshotVersion: 3 }),
        ENV,
        NOW
      )
    }
    expect(restored.notificationMutedTabIds).toBe(state.notificationMutedTabIds)
  }
)

it('accumulates mute cleanup across multiple remote workspaces in one batch', () => {
  const otherWorkspace = 'repo::/other-worktree'
  const initial = makeState()
  const state = {
    ...initial,
    ...applyWebSessionTabsSnapshots(
      initial,
      [
        makeSnapshot([surface()]),
        makeSnapshot([surface('host-tab-2')], { worktree: otherWorkspace })
      ],
      ENV,
      NOW
    ),
    notificationMutedTabIds: {
      [toWebTerminalSurfaceTabId('host-tab-1')]: true as const,
      [toWebTerminalSurfaceTabId('host-tab-2')]: true as const,
      unrelated: true as const
    }
  }
  const closed = {
    ...state,
    ...applyWebSessionTabsSnapshots(
      state,
      [
        makeSnapshot([], { snapshotVersion: 2 }),
        makeSnapshot([], { worktree: otherWorkspace, snapshotVersion: 2 })
      ],
      ENV,
      NOW
    )
  }
  expect(closed.notificationMutedTabIds).toEqual({ unrelated: true })
})
