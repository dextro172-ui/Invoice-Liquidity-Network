export default function Footer() {
  return (
    <footer className="bg-primary-container py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-primary mb-6">ILN</div>
            <p className="text-on-primary-container/70 max-w-xs mb-8 font-body text-sm leading-relaxed">
              The decentralized standard for invoice liquidity. Built for the
              modern workforce.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-on-primary-container/10 flex items-center justify-center text-on-primary-container hover:bg-on-primary-container/20 transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-on-primary-container/10 flex items-center justify-center text-on-primary-container hover:bg-on-primary-container/20 transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">
                  terminal
                </span>
              </a>
            </div>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-6">
              Network
            </h5>
            <ul className="space-y-4 text-sm text-on-primary-container/80">
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  How it works
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  For Freelancers
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  For LPs
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-6">
              Developers
            </h5>
            <ul className="space-y-4 text-sm text-on-primary-container/80">
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  Documentation
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  Technical Specs
                </a>
              </li>
              <li>
                <a className="hover:text-on-primary-container transition-colors" href="#">
                  Open Source Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-on-primary-container/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-container/60">
          <div className="flex items-center gap-4">
            <span>Built on Stellar</span>
            <span>•</span>
            <span>MIT License</span>
          </div>
          <div>© 2024 Invoice Liquidity Network.</div>
        </div>
      </div>
    </footer>
  );
}
