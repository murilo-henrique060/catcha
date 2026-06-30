/**
 * Resolve a URL para uma imagem de gato.
 * Se o caminho da imagem for relativo (ex: "cat001.webp"), resolve para a URL pública do bucket no Supabase Storage.
 * Se já for uma URL completa ou um caminho estático conhecido, retorna como está.
 *
 * @param imagePath - O caminho da imagem vindo do banco ou props.
 * @returns A URL de imagem resolvida.
 */
export function getCatImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/cats/cat001.webp"; // Fallback padrão

  // Se já for uma URL completa HTTP/HTTPS, retorna ela diretamente
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Extrai apenas o nome do arquivo (ex: "cat001.webp" de "/cats/cat001.webp")
  const filename = imagePath.split("/").pop();
  if (!filename) return "/cats/cat001.webp";

  // Se for um ativo estático de layout que foi mantido em /public/cats, serve localmente
  if (filename === "back_cover.webp" || filename === "front_background.jpg" || filename === "logo.png") {
    return `/cats/${filename}`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    // Fallback local se o Supabase não estiver configurado (ex: durante compilação)
    return `/cats/${filename}`;
  }

  // Retorna a URL pública correta do Supabase Storage
  return `${supabaseUrl}/storage/v1/object/public/cats/${filename}`;
}
