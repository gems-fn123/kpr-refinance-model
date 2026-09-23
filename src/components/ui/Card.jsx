import React from 'react';

export function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-all hover:shadow-md">
      <h2 className="mb-4 font-bold text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}
