import { Component, type ReactNode } from "react";

export default class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <div className="p-6"><section className="form-surface" role="alert">
      <h1 className="text-xl text-gray-900">Halaman belum dapat dibuka</h1>
      <p className="text-sm text-gray-500 mt-3 mb-5">Periksa koneksi dan muat ulang halaman untuk mengambil versi aplikasi yang tersedia.</p>
      <button className="primary-action" onClick={() => window.location.reload()}>Muat ulang halaman</button>
    </section></div>;
    return this.props.children;
  }
}
