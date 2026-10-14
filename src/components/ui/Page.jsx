import { useEffect, useRef } from "react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";

export default function Page({
  title,
  description,
  children,
  action,
  scenic = false,
}) {
  return (
    <>
      <Navbar />
      <main className="page">
        <header className={`page-heading ${scenic ? "scenic-heading" : ""}`}>
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {action}
        </header>
        {children}
      </main>
      <Footer />
    </>
  );
}
export function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function Empty({ title, children }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog className="modal" ref={ref} onCancel={onClose}>
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
