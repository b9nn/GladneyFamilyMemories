import { useState } from 'react'
import { Pencil, Trash2, Check, X, ShieldCheck, User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useToast } from '@/components/shared/toast'
import { useUsers, useDeleteUser, useUpdateUsername } from '../hooks/use-admin'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { formatDateTime } from '@/lib/utils/date'

export function UserManagement() {
  const { toast } = useToast()
  const { user: currentUser } = useAuthStore()
  const { data: users, isLoading } = useUsers()
  const deleteUser = useDeleteUser()
  const updateUsername = useUpdateUsername()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [deletingUser, setDeletingUser] = useState<{ id: number; username: string } | null>(null)

  const handleSaveUsername = async (userId: number, oldUsername: string) => {
    if (!newUsername.trim() || newUsername === oldUsername) return
    try {
      await updateUsername.mutateAsync({ userId, username: newUsername })
      toast(`Username changed to "${newUsername}"`, 'success')
      setEditingId(null)
    } catch {
      toast('Failed to update username', 'error')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Users</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : !users?.length ? (
          <p className="text-sm text-muted-foreground">No users registered.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-lg border p-4 space-y-2">
                {/* Username */}
                <div className="flex items-center gap-2">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername(u.id, u.username)}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveUsername(u.id, u.username)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-primary">{u.username}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(u.id); setNewUsername(u.username) }}>
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                    </>
                  )}
                  {u.is_admin ? (
                    <Badge className="ml-auto"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto"><UserIcon className="h-3 w-3 mr-1" />User</Badge>
                  )}
                </div>

                {/* Details */}
                <div className="text-sm space-y-0.5">
                  <p><span className="text-muted-foreground">Name:</span> {u.full_name || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {u.email || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Registered: {formatDateTime(u.created_at)}</p>
                </div>

                {/* Delete (can't delete yourself) */}
                {currentUser && u.id !== currentUser.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeletingUser({ id: u.id, username: u.username })}
                  >
                    <Trash2 className="h-3 w-3" /> Delete User
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={() => setDeletingUser(null)}
        title="Delete User"
        description={`Permanently delete "${deletingUser?.username}" and all their content?`}
        confirmLabel="Delete" destructive
        onConfirm={() => {
          if (deletingUser) {
            deleteUser.mutate(deletingUser.id)
            toast(`User "${deletingUser.username}" deleted`, 'success')
          }
        }}
      />
    </Card>
  )
}
