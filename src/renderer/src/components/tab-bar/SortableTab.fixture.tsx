import { DndContext } from '@dnd-kit/core'
import { defineFixture } from '../../component-fixtures/component-fixture'
import SortableTab, { type SortableTabProps } from './SortableTab'

const noop = (): void => {}
const props: SortableTabProps = {
  tab: {
    id: 'muted-tab',
    worktreeId: 'fixture-workspace',
    title: 'Agent running 200 tasks',
    customTitle: null,
    color: null
  },
  agent: 'claude',
  unifiedTabId: 'muted-tab',
  groupId: 'fixture-group',
  tabCount: 2,
  hasTabsToRight: true,
  hasTabsToLeft: false,
  isActive: false,
  isPinned: false,
  isExpanded: false,
  onActivate: noop,
  onClose: noop,
  onCloseOthers: noop,
  onCloseToRight: noop,
  onCloseToLeft: noop,
  onSetCustomTitle: noop,
  onSetTabColor: noop,
  onTogglePin: noop,
  onToggleExpand: noop,
  dragData: {
    kind: 'tab',
    worktreeId: 'fixture-workspace',
    groupId: 'fixture-group',
    unifiedTabId: 'muted-tab',
    visibleTabId: 'muted-tab',
    tabType: 'terminal',
    label: 'Agent running 200 tasks'
  }
}

export const muted = defineFixture({
  width: 360,
  store: { notificationMutedTabIds: { 'muted-tab': true } },
  render: () => (
    <DndContext>
      <div className="flex h-8">
        <SortableTab {...props} />
      </div>
    </DndContext>
  )
})

export const mutedMenu = defineFixture({
  ...muted,
  interact: (frame) => {
    const tab = frame.querySelector('[data-testid="sortable-tab"]')
    if (!tab) {
      throw new Error('Missing fixture tab')
    }
    tab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 16, clientY: 32 }))
  }
})
