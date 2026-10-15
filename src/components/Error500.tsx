export default function Error500({ onGoHome, onRetry }: { onGoHome?: () => void; onRetry?: () => void }) {
  return <main className="min-h-dvh bg-gray-50 flex items-center justify-center p-6"><div className="max-w-lg">
    <p className="text-sm text-gray-500 mb-4">Gangguan layanan · 500</p>
    <h1 className="text-3xl text-gray-900 mb-4">Permintaan belum dapat diproses.</h1>
    <p className="text-gray-600 leading-relaxed">Coba muat kembali. Jika gangguan berlanjut, hubungi administrator TPID.</p>
    <div className="flex flex-wrap gap-3 mt-7">{onRetry && <button className="primary-action" onClick={onRetry}>Coba lagi</button>}{onGoHome && <button className="secondary-action" onClick={onGoHome}>Ke dashboard</button>}</div>
  </div></main>;
}
