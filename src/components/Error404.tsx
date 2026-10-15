export default function Error404({ onGoHome, onGoBack }: { onGoHome?: () => void; onGoBack?: () => void }) {
  return <main className="min-h-dvh bg-gray-50 flex items-center justify-center p-6"><div className="max-w-lg">
    <p className="text-sm text-gray-500 mb-4">Halaman tidak tersedia · 404</p>
    <h1 className="text-3xl text-gray-900 mb-4">Halaman ini tidak dapat dibuka.</h1>
    <p className="text-gray-600 leading-relaxed">Alamat mungkin tidak tersedia atau akun Anda tidak memiliki akses. Kembali ke dashboard untuk melanjutkan.</p>
    <div className="flex flex-wrap gap-3 mt-7">{onGoHome && <button className="primary-action" onClick={onGoHome}>Ke dashboard</button>}{onGoBack && <button className="secondary-action" onClick={onGoBack}>Kembali</button>}</div>
  </div></main>;
}
