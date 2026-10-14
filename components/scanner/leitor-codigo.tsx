"use client";

import { CameraOffIcon, FlashlightIcon, FlashlightOffIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { extrairTag } from "@/lib/tag";
import { cn } from "@/lib/utils";

type Estado = "iniciando" | "carregando-leitor" | "lendo" | "erro";

// Área de leitura, em fração do quadro da câmera (centralizada)
const GUIA = { largura: 0.82, altura: 0.22 };
const INTERVALO_MS = 350;
// Altura (px) do recorte enviado ao OCR: texto grande o bastante para o Tesseract
const ALTURA_OCR = 120;

/**
 * Abre a câmera traseira e lê, por OCR, o código impresso na etiqueta
 * (ex.: IGR-0001). Só confirma a leitura quando o mesmo código aparece em
 * duas leituras seguidas; o mesmo código só é repetido depois de alguns segundos.
 */
export function LeitorCodigo({
  onLeitura,
  className,
}: {
  onLeitura: (tag: string) => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [erro, setErro] = useState("");
  const [lanterna, setLanterna] = useState<{ suportada: boolean; ligada: boolean }>({
    suportada: false,
    ligada: false,
  });
  const trilhaRef = useRef<MediaStreamTrack | null>(null);

  // Mantém o callback mais recente sem reiniciar a câmera
  const onLeituraRef = useRef(onLeitura);
  useEffect(() => {
    onLeituraRef.current = onLeitura;
  }, [onLeitura]);

  useEffect(() => {
    let cancelado = false;
    let stream: MediaStream | null = null;
    let worker: import("tesseract.js").Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let candidato: string | null = null;
    let ultimo = { tag: "", em: 0 };
    const canvas = document.createElement("canvas");

    async function iniciar() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setEstado("erro");
        setErro(
          "A câmera só funciona em conexão segura (HTTPS). Abra o sistema pelo endereço https:// ou instale o app.",
        );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (e) {
        if (cancelado) return;
        const nome = (e as Error)?.name ?? "";
        setEstado("erro");
        setErro(
          nome === "NotAllowedError"
            ? "Permissão da câmera negada. Libere o acesso à câmera nas configurações do navegador e tente novamente."
            : nome === "NotFoundError"
              ? "Nenhuma câmera encontrada neste dispositivo."
              : "Não foi possível abrir a câmera.",
        );
        return;
      }
      if (cancelado) return pararStream();

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const trilha = stream.getVideoTracks()[0];
      trilhaRef.current = trilha;
      const capacidades = trilha.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capacidades?.torch) setLanterna({ suportada: true, ligada: false });

      // O leitor de texto (Tesseract) é baixado na primeira vez e fica em cache
      setEstado("carregando-leitor");
      // Pacote CommonJS: no import dinâmico o conteúdo vem em `default`
      const Tesseract = (await import("tesseract.js")).default;
      worker = await Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY);
      if (cancelado) return;
      await worker.setParameters({
        tessedit_char_whitelist: "IGR-0123456789",
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
      });
      if (cancelado) return;

      setEstado("lendo");
      agendar();
    }

    function agendar() {
      if (!cancelado) timer = setTimeout(ler, INTERVALO_MS);
    }

    async function ler() {
      const video = videoRef.current;
      if (!video || !worker || video.readyState < 2) return agendar();

      if (!recortarGuia(video, canvas)) return agendar();
      try {
        const { data } = await worker.recognize(canvas);
        if (cancelado) return;
        const tag = extrairTag(data.text);

        if (!tag) {
          candidato = null;
        } else if (tag !== candidato) {
          // Primeira vez que vê este código: espera confirmar na próxima leitura
          candidato = tag;
        } else {
          const agora = Date.now();
          if (tag !== ultimo.tag || agora - ultimo.em > 3000) {
            ultimo = { tag, em: agora };
            navigator.vibrate?.(80);
            onLeituraRef.current(tag);
          }
        }
      } catch {
        // erro pontual do OCR: tenta de novo na próxima volta
      }
      agendar();
    }

    function pararStream() {
      stream?.getTracks().forEach((t) => t.stop());
    }

    iniciar();

    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
      pararStream();
      trilhaRef.current = null;
      worker?.terminate().catch(() => {});
    };
  }, []);

  async function alternarLanterna() {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const ligada = !lanterna.ligada;
    try {
      await trilha.applyConstraints({ advanced: [{ torch: ligada } as MediaTrackConstraintSet] });
      setLanterna({ suportada: true, ligada });
    } catch {
      setLanterna({ suportada: false, ligada: false });
    }
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black",
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />

      {/* Moldura-guia: a leitura usa só esta área */}
      {estado !== "erro" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative rounded-lg border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{ width: `${GUIA.largura * 100}%`, height: `${GUIA.altura * 100}%` }}
          >
            {estado === "lendo" && (
              <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500/80" />
            )}
          </div>
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white drop-shadow">
            {estado === "lendo"
              ? "Centralize o código (ex.: IGR-0001) dentro da moldura"
              : estado === "carregando-leitor"
                ? "Preparando o leitor de texto…"
                : "Abrindo a câmera…"}
          </p>
        </div>
      )}

      {(estado === "iniciando" || estado === "carregando-leitor") && (
        <Loader2Icon className="absolute top-3 right-3 size-5 animate-spin text-white/80" />
      )}

      {lanterna.suportada && estado === "lendo" && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-3 left-3"
          onClick={alternarLanterna}
          aria-label={lanterna.ligada ? "Desligar lanterna" : "Ligar lanterna"}
        >
          {lanterna.ligada ? <FlashlightOffIcon /> : <FlashlightIcon />}
        </Button>
      )}

      {estado === "erro" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
          <CameraOffIcon className="size-8" />
          {erro}
        </div>
      )}
    </div>
  );
}

/**
 * Copia para o canvas a parte do vídeo que está dentro da moldura-guia
 * (considerando o object-cover), em tons de cinza com contraste aumentado.
 */
function recortarGuia(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = video.clientWidth;
  const ch = video.clientHeight;
  if (!vw || !vh || !cw || !ch) return false;

  // object-cover: escala que cobre o container
  const escala = Math.max(cw / vw, ch / vh);
  const desvioX = (vw * escala - cw) / 2;
  const desvioY = (vh * escala - ch) / 2;

  const gw = cw * GUIA.largura;
  const gh = ch * GUIA.altura;
  const gx = (cw - gw) / 2;
  const gy = (ch - gh) / 2;

  const sx = (gx + desvioX) / escala;
  const sy = (gy + desvioY) / escala;
  const sw = gw / escala;
  const sh = gh / escala;

  const fator = ALTURA_OCR / sh;
  canvas.width = Math.round(sw * fator);
  canvas.height = ALTURA_OCR;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // Tons de cinza + esticar o contraste (texto escuro em fundo claro)
  const imagem = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = imagem.data;
  let min = 255;
  let max = 0;
  const cinza = new Uint8ClampedArray(px.length / 4);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    cinza[j] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const faixa = Math.max(1, max - min);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = ((cinza[j] - min) / faixa) * 255;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(imagem, 0, 0);
  return true;
}
