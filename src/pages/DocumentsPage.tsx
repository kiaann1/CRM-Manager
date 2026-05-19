import { FileText, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { formatDate } from '../lib/format'
import { stripHtml } from '../lib/html'

export function DocumentsPage() {
  const { documents, deleteDocument } = useCrm()
  const toast = useToast()
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Docs"
        description="Wiki-style documents linked to CRM records"
        actions={
          <Button onClick={() => navigate('/docs/new')}>
            <Plus size={16} className="mr-1 inline" />
            New doc
          </Button>
        }
      />

      {documents.length === 0 ? (
        <div className="page-shell">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Create playbooks, account notes, and runbooks for your team."
            action={
              <Button onClick={() => navigate('/docs/new')}>
                <Plus size={16} className="mr-1 inline" />
                Create document
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="page-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => {
            const preview = stripHtml(d.content) || 'No content yet.'
            return (
              <li
                key={d.id}
                className="group panel flex flex-col transition-shadow hover:shadow-lg"
              >
                <Link to={`/docs/${d.id}`} className="flex flex-1 flex-col p-5">
                  <FileText className="mb-2 text-brand-600" size={24} />
                  <h3 className="font-semibold group-hover:text-brand-600">{d.title}</h3>
                  <p className="mt-2 line-clamp-4 flex-1 text-sm text-text-muted">{preview}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    Updated {formatDate(d.updatedAt)}
                    {d.recordType ? ` · ${d.recordType}` : ' · general'}
                  </p>
                </Link>
                <div className="border-t border-border px-5 py-3 dark:border-slate-700">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() =>
                      deleteConfirm(toast.askConfirm, d.title, () => {
                        deleteDocument(d.id)
                        toast.success('Document deleted')
                      })
                    }
                  >
                    <Trash2 size={14} className="mr-1 inline" />
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
