import { PageHeader } from '@/components/shared/page-header'
import { InviteCodesPanel } from './components/invite-codes-panel'
import { UserManagement } from './components/user-management'
import { BackgroundManager } from './components/background-manager'
import { FileTools } from './components/file-tools'

export function AdminPage() {
  return (
    <div>
      <PageHeader title="Admin Panel" description="Manage users, invites, and settings" />
      <div className="space-y-6">
        <UserManagement />
        <InviteCodesPanel />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BackgroundManager />
          <FileTools />
        </div>
      </div>
    </div>
  )
}

export default AdminPage
