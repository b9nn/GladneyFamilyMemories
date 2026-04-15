import { useState } from 'react'
import { Plus, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useToast } from '@/components/shared/toast'
import { useInviteCodes, useCreateInviteCode, useDeleteInviteCode } from '../hooks/use-admin'
import { formatDateTime } from '@/lib/utils/date'

export function InviteCodesPanel() {
  const { toast } = useToast()
  const { data: codes, isLoading } = useInviteCodes()
  const createCode = useCreateInviteCode()
  const deleteCode = useDeleteInviteCode()

  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [sendEmail, setSendEmail] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const activeCodes = codes?.filter((c) => !c.is_used) || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createCode.mutateAsync({
        email: email || undefined,
        recipient_name: recipientName || undefined,
        expires_in_days: expiresInDays,
        send_email: sendEmail,
      })
      toast(`Invite code created: ${result.code}`, 'success')
      setEmail(''); setRecipientName(''); setExpiresInDays(30); setSendEmail(false); setShowForm(false)
    } catch {
      toast('Failed to create invite code', 'error')
    }
  }

  const isExpired = (expiresAt: string | null) => expiresAt ? new Date(expiresAt) < new Date() : false

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invite Codes</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Create'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-lg border bg-muted/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email (optional)</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Restrict to email" />
              </div>
              <div className="space-y-1">
                <Label>Recipient Name (optional)</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="For email personalization" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Expires In (days)</Label>
                <Input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))} min={1} max={365} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} disabled={!email} className="rounded" />
                  Send invite via email
                </label>
              </div>
            </div>
            <Button type="submit" disabled={createCode.isPending}>
              {createCode.isPending ? 'Creating...' : sendEmail && email ? 'Generate & Send' : 'Generate Code'}
            </Button>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : activeCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active invite codes.</p>
        ) : (
          <div className="space-y-2">
            {activeCodes.map((code) => (
              <div key={code.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{code.code}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(code.code); toast('Copied!', 'success') }} aria-label="Copy invite code">
                  <Copy className="h-3 w-3" />
                </Button>
                <span className="text-sm text-muted-foreground flex-1">{code.email || 'Any email'}</span>
                {isExpired(code.expires_at) ? (
                  <Badge variant="destructive">Expired</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Expires {code.expires_at ? formatDateTime(code.expires_at) : 'Never'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(code.id)} aria-label="Delete invite code">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
        title="Delete Invite Code"
        description="Are you sure you want to delete this invite code?"
        confirmLabel="Delete" destructive
        onConfirm={() => { if (deletingId) { deleteCode.mutate(deletingId); toast('Invite code deleted', 'success') } }}
      />
    </Card>
  )
}
