import QRCode from "qrcode";

import { cn } from "@/lib/utils";

/** QR Code em SVG gerado no servidor (o conteúdo é a própria tag, ex.: IGR-0001). */
export async function QrCode({
  valor,
  className,
}: {
  valor: string;
  className?: string;
}) {
  const svg = await QRCode.toString(valor, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });

  return (
    <div
      role="img"
      aria-label={`QR Code ${valor}`}
      className={cn("[&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
