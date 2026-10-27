import { afterEach, expect, it, vi } from 'vitest'
import {
  submitHookLaneCompletion,
  discardHookLaneCompletionRequests
} from './agent-hook-completion-revision-hold'
import type { AgentCompletionStatusSnapshot } from '@/components/terminal-pane/agent-completion-coordinator-types'
import type { NotificationDispatchResult } from '../../../shared/notification-settings-types'

const PANE_KEY = 'tab-1:11111111-1111-4111-8111-111111111111'

vi.mock('@/store', () => ({
  useAppStore: {
    getState: () => ({
      agentStatusByPaneKey: {
        [PANE_KEY]: { state: 'done', stateStartedAt: 100, turnEndedAt: 200 }
      }
    })
  }
}))

afterEach(() => {
  discardHookLaneCompletionRequests(PANE_KEY)
  vi.useRealTimers()
})

it('consumes revisions while muted instead of replaying them after notifications are enabled', () => {
  vi.useFakeTimers()
  let muted = true
  const submit = vi.fn((onResult: (result: NotificationDispatchResult | null) => void) => {
    onResult(muted ? { delivered: false, reason: 'tab-muted' } : { delivered: true })
    return true
  })
  const snapshot: AgentCompletionStatusSnapshot = {
    state: 'done',
    stateStartedAt: 100,
    turnEndedAt: 200,
    prompt: 'task',
    agentType: 'codex'
  }
  const lane = { keepsAuthority: () => true, submit }
  submitHookLaneCompletion(PANE_KEY, snapshot, lane)
  submitHookLaneCompletion(PANE_KEY, snapshot, lane)
  expect(submit).toHaveBeenCalledTimes(2)
  muted = false
  vi.runAllTimers()
  expect(submit).toHaveBeenCalledTimes(2)
  submitHookLaneCompletion(PANE_KEY, snapshot, lane)
  expect(submit).toHaveBeenCalledTimes(3)
})
