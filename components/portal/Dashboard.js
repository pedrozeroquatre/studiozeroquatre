import Link from 'next/link'
import { cn } from '@/lib/cn'

const STATUS_STYLES = {
  'Livré': 'bg-green-50 text-green-800 border-green-200',
  'En cours': 'bg-amber-50 text-amber-800 border-amber-200',
  'En attente': 'bg-gray-50 text-gray-600 border-gray-200',
}

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] uppercase tracking-widest px-2 py-1 border rounded',
        STATUS_STYLES[status] ?? STATUS_STYLES['En attente']
      )}
    >
      {status}
    </span>
  )
}

export default function Dashboard({ client, onLogout }) {
  return (
    <div className="min-h-dvh pt-20 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-2">
              Espace clients
            </p>
            <h1 className="font-syne font-bold text-2xl md:text-3xl">
              Bienvenue, {client.name}
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="font-mono text-xs text-text3 hover:text-text transition-colors border border-[var(--border)] px-3 py-2 rounded mt-1"
          >
            Déconnexion
          </button>
        </div>

        {/* Orders table */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">
            Historique des commandes
          </p>

          {/* Desktop table */}
          <div className="hidden md:block border border-[var(--border)] rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-surface">
                  <th className="font-mono text-[10px] uppercase tracking-widest text-text3 text-left px-4 py-3">Date</th>
                  <th className="font-mono text-[10px] uppercase tracking-widest text-text3 text-left px-4 py-3">Référence</th>
                  <th className="font-mono text-[10px] uppercase tracking-widest text-text3 text-left px-4 py-3">Articles</th>
                  <th className="font-mono text-[10px] uppercase tracking-widest text-text3 text-left px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {client.orders.map((order, i) => (
                  <tr
                    key={order.ref}
                    className={cn(
                      i < client.orders.length - 1 && 'border-b border-[var(--border)]'
                    )}
                  >
                    <td className="font-mono text-xs tabular-nums text-text2 px-4 py-4">
                      {order.date}
                    </td>
                    <td className="font-mono text-xs tabular-nums text-text px-4 py-4">
                      {order.ref}
                    </td>
                    <td className="font-mono text-xs text-text2 px-4 py-4">
                      {order.items}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {client.orders.map((order) => (
              <div key={order.ref} className="border border-[var(--border)] rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs tabular-nums text-text">{order.ref}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-mono text-xs text-text2 mb-1">{order.items}</p>
                <p className="font-mono text-[10px] tabular-nums text-text3">{order.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* New order CTA */}
        <Link
          href="/devis"
          className="inline-block font-mono text-sm border border-[var(--border2)] px-6 py-3 rounded hover:bg-surface transition-colors"
        >
          + Nouvelle commande
        </Link>
      </div>
    </div>
  )
}
