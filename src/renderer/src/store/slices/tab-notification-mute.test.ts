import { describe, expect, it } from 'vitest'
import { createUIStore, makePersistedUI } from './ui-slice-test-harness'
import {
  capturePersistedUIWriteBaseline,
  diffPersistedUIWriteFields,
  persistedUIWriteFieldsToWireUpdate
} from './persisted-ui-write-baseline'

describe('tab notification mute persistence', () => {
  it('round-trips only the tab preference through the UI writer', () => {
    const store = createUIStore()
    store.getState().hydratePersistedUI(makePersistedUI(), 'startup')
    const baseline = capturePersistedUIWriteBaseline(store.getState())
    store.getState().setTabNotificationsMuted('tab-a', true)
    const patch = persistedUIWriteFieldsToWireUpdate(
      diffPersistedUIWriteFields(capturePersistedUIWriteBaseline(store.getState()), baseline)
    )
    expect(patch).toEqual({ notificationMutedTabIds: { 'tab-a': true } })
    const restored = createUIStore()
    restored.getState().hydratePersistedUI(makePersistedUI(patch), 'startup')
    expect(restored.getState().notificationMutedTabIds).toEqual({ 'tab-a': true })
    restored.getState().setTabNotificationsMuted('tab-b', true)
    restored.getState().setTabNotificationsMuted('tab-a', false)
    expect(restored.getState().notificationMutedTabIds).toEqual({ 'tab-b': true })
  })

  it('preserves a local toggle against stale hydration until it is acknowledged', () => {
    const store = createUIStore()
    store.getState().hydratePersistedUI(makePersistedUI(), 'startup')
    store.getState().setTabNotificationsMuted('tab-a', true)
    store.getState().hydratePersistedUI(makePersistedUI())
    expect(store.getState().notificationMutedTabIds).toEqual({ 'tab-a': true })
  })
})
