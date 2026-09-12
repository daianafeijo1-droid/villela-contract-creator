import { useEffect, useState } from "react";

/** Cache em memória: evita re-renderizar o mesmo PDF toda vez que o componente remonta. */
const cache = new Map<string, string>();

let workerConfigurado = false;

type Props = {
  url: string;
  width?: number;
  className?: string;
  alt?: string;
};

/** Renderiza a 1ª página de um PDF como imagem (miniatura), sem a UI nativa do navegador. */
export function PdfThumbnail({ url, width = 240, className = "", alt = "Miniatura do modelo" }: Props) {
  const [src, setSrc] = useState<string | null>(cache.get(url) ?? null);
  const [status, setStatus] = useState<"ok" | "carregando" | "erro">(
    cache.has(url) ? "ok" : "carregando",
  );

  useEffect(() => {
    let cancelado = false;
    if (cache.has(url)) {
      setSrc(cache.get(url)!);
      setStatus("ok");
      return;
    }
    setStatus("carregando");
    setSrc(null);

    (async () => {
      try {
        // Carregado apenas no navegador: evita qualquer efeito colateral durante o SSR.
        const pdfjsLib = await import("pdfjs-dist");
        if (!workerConfigurado) {
          const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          workerConfigurado = true;
        }

        const pdf = await pdfjsLib.getDocument({
          url,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        }).promise;
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Sem contexto 2D disponível");

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        if (cancelado) return;
        cache.set(url, dataUrl);
        setSrc(dataUrl);
        setStatus("ok");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[PdfThumbnail] falha ao renderizar", url, e);
        if (!cancelado) setStatus("erro");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [url, width]);

  if (status === "erro") {
    return (
      <div
        className={`grid place-items-center bg-ink/5 text-center text-[10px] font-bold text-ink/40 ${className}`}
      >
        Pré-visualização
        <br />
        indisponível
      </div>
    );
  }

  if (status === "carregando" || !src) {
    return <div className={`animate-pulse bg-ink/10 ${className}`} />;
  }

  return <img src={src} alt={alt} className={`object-contain ${className}`} />;
}
