import Link from "next/link";

interface ResourceCardProps {
  title: string;
  description: string;
  buttonText: string;
  /** 없으면 "준비 중" 으로 표시한다 (아직 만들지 않은 페이지로 404 링크를 걸지 않기 위해) */
  href?: string;
}

export default function ResourceCard({ title, description, buttonText, href }: ResourceCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-md">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
      {href ? (
        <Link
          href={href}
          className="mt-5 inline-flex w-fit items-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
        >
          {buttonText} →
        </Link>
      ) : (
        <span className="mt-5 inline-flex w-fit items-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
          준비 중
        </span>
      )}
    </div>
  );
}
