import Image from "next/image";
import type { ReactNode } from "react";
import ScreenshotPlaceholder from "@/components/ScreenshotPlaceholder";

/** 서비스 소개 페이지 상단 제목·설명 */
export function FeatureHero({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl lg:leading-tight">
        {title}
      </h1>
      <p className="mt-4 text-base text-white/90 sm:text-lg">{description}</p>
    </header>
  );
}

/** 하위 섹션 제목·설명 */
export function FeatureSection({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto mt-20 max-w-4xl text-center">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm text-white/90 sm:text-base">{description}</p>
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}

type ShotProps = {
  alt: string;
  size?: "lg" | "md";
  priority?: boolean;
} & (
  | { src: string; width: number; height: number; placeholder?: never }
  | { placeholder: string; src?: never; width?: never; height?: never }
);

/** 흰 카드에 담긴 스크린샷. placeholder 를 주면 자리표시를 그린다 */
export function Screenshot(props: ShotProps) {
  const max = props.size === "md" ? "max-w-4xl" : "max-w-5xl";
  return (
    <figure className={`mx-auto mt-10 w-full ${max} overflow-hidden rounded-xl bg-white p-2 shadow-lg sm:p-3`}>
      {props.placeholder !== undefined ? (
        <ScreenshotPlaceholder name={props.placeholder} />
      ) : (
        <Image
          src={props.src}
          alt={props.alt}
          width={props.width}
          height={props.height}
          priority={props.priority}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="h-auto w-full rounded-lg"
        />
      )}
      <figcaption className="sr-only">{props.alt}</figcaption>
    </figure>
  );
}

/** 기능 요약 카드 3열 */
export function FeatureCards({ items }: { items: { title: string; body: string }[] }) {
  return (
    <section aria-labelledby="feature-cards-title">
      {/* 카드 제목(h3) 위에 h2 가 없는 페이지도 있어 제목 단계가 건너뛰지 않게 (화면 읽기용) */}
      <h2 id="feature-cards-title" className="sr-only">
        주요 기능
      </h2>
      <ul className="mx-auto mt-16 grid max-w-5xl gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-xl bg-white p-6 text-slate-800 shadow-md">
            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
