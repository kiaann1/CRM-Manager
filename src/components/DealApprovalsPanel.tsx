import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

export function DealApprovalsPanel({ dealId }: { dealId: string }) {
  const { approvals, users, currentUser, requestApproval, respondApproval, getUser } = useCrm()
  const toast = useToast()
  const dealApprovals = approvals.filter((a) => a.dealId === dealId)
  const [title, setTitle] = useState('Discount / pricing approval')
  const [approverId, setApproverId] = useState(
    users.find((u) => u.id !== currentUser?.id)?.id ?? users[0]?.id ?? '',
  )

  const managers = users.filter(
    (u) => u.role === 'admin' || u.role === 'manager' || u.id !== currentUser?.id,
  )

  const request = () => {
    if (!title.trim() || !approverId) {
      toast.error('Title and approver required')
      return
    }
    requestApproval({ dealId, title: title.trim(), approverId })
    toast.success('Approval requested')
  }

  return (
    <div className="space-y-4">
      <div className="list-item p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-text-muted">Request approval</p>
        <div className="space-y-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="Approver"
            value={approverId}
            onChange={(e) => setApproverId(e.target.value)}
            options={managers.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Button onClick={request}>Send request</Button>
        </div>
      </div>

      <ul className="space-y-2">
        {dealApprovals.length === 0 ? (
          <p className="text-sm text-text-muted">No approvals on this deal.</p>
        ) : (
          dealApprovals.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border px-3 py-2.5 dark:border-slate-700"
            >
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-text-muted">
                {getUser(a.requesterId)?.name} → {getUser(a.approverId)?.name} ·{' '}
                {formatDate(a.createdAt)}
              </p>
              <p className="mt-1 text-xs capitalize font-medium text-text-muted">{a.status}</p>
              {a.status === 'pending' && a.approverId === currentUser?.id && (
                <div className="mt-2 flex gap-2">
                  <Button
                    className="!py-1.5 text-xs"
                    onClick={() => {
                      respondApproval(a.id, 'approved')
                      toast.success('Approved')
                    }}
                  >
                    <Check size={14} /> Approve
                  </Button>
                  <Button
                    variant="secondary"
                    className="!py-1.5 text-xs"
                    onClick={() => {
                      respondApproval(a.id, 'rejected')
                      toast.info('Declined')
                    }}
                  >
                    <X size={14} /> Decline
                  </Button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
