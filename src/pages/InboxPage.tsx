import { Check, Mail, MessageSquarePlus, Reply, Send, Users, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'

type InboxFilter = 'all' | 'team' | 'direct' | 'unread'
type ComposeTarget = 'team' | 'user'

export function InboxPage() {
  const {
    inbox,
    teams,
    users,
    markInboxRead,
    sendInboxMessage,
    logEmail,
    contacts,
    currentUser,
  } = useCrm()
  const toast = useToast()

  const [filter, setFilter] = useState<InboxFilter>('all')
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTarget, setComposeTarget] = useState<ComposeTarget>('team')
  const [teamId, setTeamId] = useState('')
  const [recipientUserId, setRecipientUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')

  const teammates = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser?.id],
  )

  const unread = inbox.filter((m) => !m.read).length

  const filtered = useMemo(() => {
    return inbox.filter((m) => {
      if (filter === 'unread') return !m.read
      if (filter === 'team') return Boolean(m.teamId) && !m.recipientUserId
      if (filter === 'direct') return Boolean(m.recipientUserId)
      return true
    })
  }, [inbox, filter])

  const openCompose = (preset?: { target: ComposeTarget; teamId?: string; userId?: string }) => {
    setComposeTarget(preset?.target ?? 'team')
    setTeamId(preset?.teamId ?? teams[0]?.id ?? '')
    setRecipientUserId(preset?.userId ?? teammates[0]?.id ?? '')
    setSubject('')
    setBody('')
    setComposeOpen(true)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are required')
      return
    }
    if (composeTarget === 'team' && !teamId) {
      toast.error('Select a team')
      return
    }
    if (composeTarget === 'user' && !recipientUserId) {
      toast.error('Select a teammate')
      return
    }

    setSending(true)
    sendInboxMessage({
      subject: subject.trim(),
      body: body.trim(),
      ...(composeTarget === 'team' ? { teamId } : { recipientUserId }),
    })
    toast.success(composeTarget === 'team' ? 'Posted to team' : 'Message sent')
    setComposeOpen(false)
    setSending(false)
  }

  const sendReply = (msg: (typeof inbox)[0]) => {
    if (!replyBody.trim() || !currentUser) {
      toast.error('Write a reply')
      return
    }

    if (msg.senderId || msg.recipientUserId) {
      const recipient =
        msg.senderId && msg.senderId !== currentUser.id ? msg.senderId : msg.recipientUserId
      if (recipient) {
        sendInboxMessage({
          subject: `Re: ${msg.subject}`,
          body: replyBody.trim(),
          recipientUserId: recipient,
        })
        toast.success('Reply sent')
      }
    } else {
      const contact = contacts.find((c) => c.email.toLowerCase() === msg.from.toLowerCase())
      if (contact) {
        logEmail({
          recordType: 'contact',
          recordId: contact.id,
          to: msg.from,
          subject: `Re: ${msg.subject}`,
          body: replyBody.trim(),
          userId: currentUser.id,
        })
        toast.success('Reply logged to contact timeline')
      } else {
        toast.success('Marked read')
      }
    }

    markInboxRead(msg.id)
    setReplyId(null)
    setReplyBody('')
  }

  const messageLabel = (m: (typeof inbox)[0]) => {
    if (m.recipientUserId) {
      const peer =
        m.senderId === currentUser?.id
          ? users.find((u) => u.id === m.recipientUserId)?.name
          : m.from
      return `Direct · ${peer ?? 'user'}`
    }
    if (m.teamId) {
      const team = teams.find((t) => t.id === m.teamId)?.name ?? 'Team'
      return m.senderId ? `${team} · internal` : `${team} · inbound`
    }
    return 'Message'
  }

  const filters: { key: InboxFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'team', label: 'Team' },
    { key: 'direct', label: 'Direct' },
    { key: 'unread', label: `Unread (${unread})` },
  ]

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Team channels, direct messages, and shared inbound mail"
        actions={
          <div className="flex flex-wrap gap-2">
            {unread > 0 && (
              <Button
                variant="secondary"
                onClick={() => inbox.filter((m) => !m.read).forEach((m) => markInboxRead(m.id))}
              >
                <Check size={16} /> Mark all read
              </Button>
            )}
            <Button onClick={() => openCompose()}>
              <MessageSquarePlus size={16} className="mr-1 inline" />
              New message
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-border px-8 pb-4 dark:border-slate-700">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-surface-muted text-text-muted hover:text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2 p-8">
        {filtered.map((m) => {
          const isMine = m.senderId === currentUser?.id
          const isInternal = Boolean(m.senderId)
          return (
            <li
              key={m.id}
              className={`panel panel-pad ${
                m.read ? 'opacity-75' : 'border-brand-200 dark:border-brand-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    {m.recipientUserId ? (
                      <User size={12} className="shrink-0" />
                    ) : (
                      <Users size={12} className="shrink-0" />
                    )}
                    {messageLabel(m)}
                    {isMine && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase dark:bg-slate-800">
                        You
                      </span>
                    )}
                  </p>
                  <p className="font-medium">{m.subject}</p>
                  <p className="text-sm text-text-muted">
                    {isInternal ? `From ${m.from}` : `From ${m.from}`} · {formatDate(m.receivedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!m.read && (
                    <Button
                      variant="secondary"
                      className="!py-1.5 text-xs"
                      onClick={() => markInboxRead(m.id)}
                    >
                      <Check size={14} /> Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="!py-1.5 text-xs"
                    onClick={() => {
                      setReplyId(replyId === m.id ? null : m.id)
                      setReplyBody('')
                    }}
                  >
                    <Reply size={14} /> Reply
                  </Button>
                </div>
              </div>

              <p className="mt-2 text-sm whitespace-pre-wrap">{m.body}</p>

              {replyId === m.id && (
                <div className="mt-4 space-y-2 border-t border-border pt-4 dark:border-slate-700">
                  <Textarea
                    label={isInternal ? 'Reply' : 'Reply (logged as email activity if contact matches)'}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={() => sendReply(m)}>
                    <Mail size={16} /> {isInternal ? 'Send reply' : 'Send & log'}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {!filtered.length && (
        <p className="px-8 pb-8 text-text-muted">
          {filter === 'all' ? 'Inbox empty — post a message to your team or a teammate.' : 'No messages in this view.'}
        </p>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="New message">
        <form className="space-y-4" onSubmit={(e) => void handleSend(e)}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setComposeTarget('team')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                composeTarget === 'team'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-border text-text-muted'
              }`}
            >
              <Users size={16} /> Team
            </button>
            <button
              type="button"
              onClick={() => setComposeTarget('user')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                composeTarget === 'user'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-border text-text-muted'
              }`}
            >
              <User size={16} /> Person
            </button>
          </div>

          {composeTarget === 'team' ? (
            <Select
              label="Team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
            />
          ) : (
            <Select
              label="To"
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              options={teammates.map((u) => ({ value: u.id, label: u.name }))}
            />
          )}

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <Textarea
            label="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              <Send size={16} className="mr-1 inline" />
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
