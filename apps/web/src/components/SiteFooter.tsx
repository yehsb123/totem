import Link from "next/link";
import { FEATURE_LINKS, MAIN_LINKS } from "@/lib/nav";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-base font-extrabold tracking-tight text-slate-900">ToTem</p>
          <p className="mt-1">여행사를 위한 투어·코스 운영 도구</p>
        </div>
        <nav aria-label="하단 메뉴" className="flex flex-wrap gap-x-5 gap-y-2">
          {[...FEATURE_LINKS, ...MAIN_LINKS].map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ToTem. All rights reserved.
      </div>
    </footer>
  );
}
