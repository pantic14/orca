import { BellOff } from 'lucide-react'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'

export function TabNotificationMuteIndicator({
  tabId
}: {
  tabId: string
}): React.JSX.Element | null {
  const muted = useAppStore((s) => Boolean(s.notificationMutedTabIds[tabId]))
  return muted ? (
    <BellOff
      className="mr-1 size-3 shrink-0 text-muted-foreground"
      role="img"
      aria-label={translate('tabs.notifications.disabled', 'Notifications disabled')}
    />
  ) : null
}
