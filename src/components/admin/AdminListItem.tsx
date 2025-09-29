import React from 'react'
import { Card, CardContent } from '../ui/card'

interface AdminListItemProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function AdminListItem({ title, subtitle, actions, children }: AdminListItemProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">{title}</p>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  )
}

export default AdminListItem
