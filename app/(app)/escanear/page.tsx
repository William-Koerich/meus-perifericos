import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ScannerTela } from "@/components/scanner/scanner-tela";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Escanear" };

export default async function EscanearPage() {
  await exigirUsuario();

  return (
    <>
      <PageHeader titulo="Escanear" descricao="Leia com a câmera o código da etiqueta do equipamento" />
      <ScannerTela />
    </>
  );
}
