import { NextResponse } from 'next/server';

export const revalidate = 3600; // Se actualiza solo cada 1 hora automáticamente

export async function GET() {
  try {
    const CHANNEL_ID = "UC9dvfgMJRd8Z-_hJC1Xln1w";
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    const entries = xmlText.split('<entry>').slice(1);
    const videos = entries.map(entry => {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : 'Nuevo video en Mapa Ceibo';
      const videoId = idMatch ? idMatch[1] : '';
      
      return {
        titulo: title,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        miniatura: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoId
      };
    }).filter(v => v.videoId !== '');

    // Devolvemos solo las propiedades limpias sin el campo interno videoId
    const cleanVideos = videos.slice(0, 5).map(({ videoId, ...rest }) => rest);

    return NextResponse.json(cleanVideos);
  } catch (error) {
    return NextResponse.json({ error: "No se pudieron cargar los videos" }, { status: 500 });
  }
}