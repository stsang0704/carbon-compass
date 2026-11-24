import { useEffect, useState, type ReactNode } from "react";

export function ProfileMark({
  url,
  className,
  alt = "",
  fallback,
}: {
  url: string | null;
  className?: string;
  alt?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) return fallback;
  return <img className={className} src={url} alt={alt} onError={() => setFailed(true)} />;
}
