import type { ReactNode } from "react";

export default function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading">
    <div><h1>{title}</h1><p>{description}</p></div>
    {children && <div className="page-heading-actions">{children}</div>}
  </div>;
}
