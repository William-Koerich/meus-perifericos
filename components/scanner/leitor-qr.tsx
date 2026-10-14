"use client";

import { CameraOffIcon, Loader2Icon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Estado = "iniciando" | "lendo" | "erro";

/**
 * Abre a câmera traseira e lê QR Codes. Chama onLeitura com o texto lido
 * (o mesmo código só é repetido depois de alguns segundos).
 */
export function LeitorQr({
  onLeitura,
  className,
}: {
  onLeitura: (texto: string) => void;
  className?: string;
}) {
  const id = `leitor-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [erro, setErro] = useState("");

  // Mantém o callback mais recente sem reiniciar a câmera
  const onLeituraRef = useRef(onLeitura);
  useEffect(() => {
    onLeituraRef.current = onLeitura;
  }, [onLeitura]);

  useEffect(() => {
    let cancelado = false;
    let leitor: import("html5-qrcode").Html5Qrcode | null = null;
    let ultimo = { texto: "", em: 0 };

    async function iniciar() {
      if (!window.isSecureContext) {
        setEstado("erro");
        setErro(
          "A câmera só funciona em conexão segura (HTTPS). Abra o sistema pelo endereço https:// ou instale o app.",
        );
        return;
      }

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (cancelado) return;

      leitor = new Html5Qrcode(id, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
      });

      try {
        await leitor.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (largura, altura) => {
              const lado = Math.floor(Math.min(largura, altura) * 0.7);
              return { width: lado, height: lado };
            },
          },
          (texto) => {
            const agora = Date.now();
            if (texto === ultimo.texto && agora - ultimo.em < 2500) return;
            ultimo = { texto, em: agora };
            navigator.vibrate?.(80);
            onLeituraRef.current(texto);
          },
          undefined,
        );
        if (cancelado) {
          await leitor.stop().catch(() => {});
          return;
        }
        setEstado("lendo");
      } catch (e) {
        if (cancelado) return;
        const mensagem = String((e as Error)?.message ?? e);
        setEstado("erro");
        setErro(
          /NotAllowed|Permission/i.test(mensagem)
            ? "Permissão da câmera negada. Libere o acesso à câmera nas configurações do navegador e tente novamente."
            : /NotFound|Requested device not found/i.test(mensagem)
              ? "Nenhuma câmera encontrada neste dispositivo."
              : "Não foi possível abrir a câmera.",
        );
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      if (leitor?.isScanning) leitor.stop().catch(() => {});
    };
  }, [id]);

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl bg-black [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover",
        className,
      )}
    >
      <div id={id} className="h-full w-full" />

      {estado === "iniciando" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/80">
          <Loader2Icon className="size-6 animate-spin" />
          Abrindo a câmera…
        </div>
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
