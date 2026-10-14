"use client";

import imageCompression from "browser-image-compression";
import {
  CameraIcon,
  ImagePlusIcon,
  Loader2Icon,
  StarIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BUCKET_FOTOS, MAX_FOTOS_POR_ITEM, urlFoto } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Foto = {
  chave: string;
  caminho?: string; // definido após o upload
  previa: string; // URL pública ou blob local durante o upload
  nova: boolean; // enviada nesta edição (ainda não salva no item)
  enviando: boolean;
};

const OPCOES_COMPRESSAO = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1600,
  initialQuality: 0.8,
  fileType: "image/jpeg",
  useWebWorker: true,
};

export function FotosInput({
  name,
  iniciais,
  onEnviandoChange,
}: {
  name: string;
  iniciais: string[];
  onEnviandoChange?: (enviando: boolean) => void;
}) {
  const [fotos, setFotos] = useState<Foto[]>(() =>
    iniciais.map((caminho) => ({
      chave: caminho,
      caminho,
      previa: urlFoto(caminho),
      nova: false,
      enviando: false,
    })),
  );
  const camera = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  const enviando = fotos.some((f) => f.enviando);
  useEffect(() => onEnviandoChange?.(enviando), [enviando, onEnviandoChange]);

  const restantes = MAX_FOTOS_POR_ITEM - fotos.length;

  async function adicionar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const selecionados = Array.from(arquivos).slice(0, restantes);
    if (arquivos.length > restantes) {
      toast.warning(`Máximo de ${MAX_FOTOS_POR_ITEM} fotos por item.`);
    }

    const supabase = createClient();

    await Promise.all(
      selecionados.map(async (arquivo) => {
        const chave = crypto.randomUUID();
        const previa = URL.createObjectURL(arquivo);
        setFotos((atual) => [
          ...atual,
          { chave, previa, nova: true, enviando: true },
        ]);

        try {
          const comprimido = await imageCompression(arquivo, OPCOES_COMPRESSAO);
          const caminho = `itens/${crypto.randomUUID()}.jpg`;
          const { error } = await supabase.storage
            .from(BUCKET_FOTOS)
            .upload(caminho, comprimido, {
              contentType: "image/jpeg",
              cacheControl: "31536000",
            });
          if (error) throw error;

          setFotos((atual) =>
            atual.map((f) =>
              f.chave === chave ? { ...f, caminho, enviando: false } : f,
            ),
          );
        } catch (error) {
          console.error(error);
          toast.error(`Não foi possível enviar "${arquivo.name}".`);
          setFotos((atual) => atual.filter((f) => f.chave !== chave));
          URL.revokeObjectURL(previa);
        }
      }),
    );
  }

  function remover(foto: Foto) {
    setFotos((atual) => atual.filter((f) => f.chave !== foto.chave));
    // Foto enviada agora e descartada: apaga do Storage na hora.
    // Fotos já salvas são apagadas pelo servidor ao salvar o item.
    if (foto.nova && foto.caminho) {
      createClient().storage.from(BUCKET_FOTOS).remove([foto.caminho]);
    }
  }

  function tornarPrincipal(foto: Foto) {
    setFotos((atual) => [foto, ...atual.filter((f) => f.chave !== foto.chave)]);
  }

  const caminhos = fotos.flatMap((f) => (f.caminho ? [f.caminho] : []));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(caminhos)} />

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((foto, i) => (
            <li
              key={foto.chave}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-muted",
                i === 0 && "ring-2 ring-primary",
              )}
            >
              <Image
                src={foto.previa}
                alt={`Foto ${i + 1}`}
                fill
                sizes="(min-width: 640px) 25vw, 33vw"
                className="object-cover"
                unoptimized={foto.previa.startsWith("blob:")}
              />
              {foto.enviando && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2Icon className="size-6 animate-spin" />
                </div>
              )}
              {!foto.enviando && (
                <>
                  <button
                    type="button"
                    onClick={() => remover(foto)}
                    className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 shadow"
                    aria-label="Remover foto"
                  >
                    <XIcon className="size-4" />
                  </button>
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Principal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => tornarPrincipal(foto)}
                      className="absolute bottom-1 left-1 flex size-7 items-center justify-center rounded-full bg-background/90 shadow"
                      aria-label="Tornar foto principal"
                    >
                      <StarIcon className="size-4" />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {restantes > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => camera.current?.click()}
          >
            <CameraIcon />
            Tirar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => galeria.current?.click()}
          >
            <ImagePlusIcon />
            Galeria
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Até {MAX_FOTOS_POR_ITEM} fotos. A primeira é a principal (aparece na
        lista). As imagens são comprimidas antes do envio.
      </p>

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
