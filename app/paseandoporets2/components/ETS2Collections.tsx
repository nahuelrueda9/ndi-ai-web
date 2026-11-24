"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, X, ChevronRight, Bus, ChevronLeft, Maximize2, MessageCircle } from "lucide-react";

interface CollectionCategory {
  key: string;
  name: string;
  prefix: string;
  count: number;
  coverImg: string;
}

export default function ETS2Collections() {
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCategory && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (previewIndex === null || !selectedCategory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setPreviewIndex((prev) => (prev !== null && prev < selectedCategory.count - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        setPreviewIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, selectedCategory]);

  const collections: CollectionCategory[] = [
    { key: "marcopolo-newg7", name: "Marcopolo New G7", prefix: "marcopolo-newg7", count: 78, coverImg: "/skins/skin-marcopolo-newg7-01.jpg" },
    { key: "marcopolo-g8", name: "Marcopolo G8", prefix: "marcopolo-g8", count: 42, coverImg: "/skins/skin-marcopolo-g8-01.jpg" },
    { key: "modasa", name: "Modasa", prefix: "modasa", count: 9, coverImg: "/skins/skin-modasa-01.jpg" },
    { key: "starbus3", name: "Starbus 3", prefix: "starbus3", count: 9, coverImg: "/skins/skin-starbus3-01.jpg" },
    { key: "busscarnb1", name: "Busscar NB1", prefix: "busscarnb1", count: 6, coverImg: "/skins/skin-busscarnb1-01.jpg" },
    { key: "marcopolo-g7", name: "Marcopolo G7", prefix: "marcopolo-g7", count: 6, coverImg: "/skins/skin-marcopolo-g7-01.jpg" },
    { key: "niccoloisidro", name: "Niccolo Isidro", prefix: "niccoloisidro", count: 6, coverImg: "/skins/skin-niccoloisidro-01.jpg" },
  ];

  // Contenido del Modal de Categoría
  const modalContent = selectedCategory && previewIndex === null && (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera Fija */}
        <div className="p-6 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-25 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#75AADB]/10 flex items-center justify-center text-[#75AADB]">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="titulo-card text-black text-lg">{selectedCategory.name}</h3>
              <p className="text-xs text-slate-400">Mostrando las {selectedCategory.count} variantes (Hacé clic en cualquier foto para ampliarla)</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grilla con Imágenes */}
        <div ref={scrollContainerRef} className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50 flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: selectedCategory.count }, (_, i) => {
              const numIndex = i + 1;
              const numStrPadded = numIndex.toString().padStart(2, "0");
              const skinImgPath = `/skins/skin-${selectedCategory.prefix}-${numStrPadded}.jpg`;
              
              return (
                <div 
                  key={i} 
                  onClick={() => setPreviewIndex(i)}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#75AADB] transition-all cursor-pointer group relative"
                >
                  <div className="aspect-[16/10] w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={skinImgPath}
                      alt={`${selectedCategory.name} #${numStrPadded}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes(`-${numStrPadded}.jpg`)) {
                          target.src = `/skins/skin-${selectedCategory.prefix}-${numIndex}.jpg`;
                        } else if (target.src.endsWith(`-${numIndex}.jpg`)) {
                          target.src = `/skins/skin-${selectedCategory.prefix}-${numStrPadded}.png`;
                        } else {
                          target.src = "/logo.png";
                          target.className = "w-16 h-16 object-contain mx-auto mt-14 opacity-30";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg">
                        <Maximize2 className="w-4 h-4" /> Ver completa
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );

  // Contenido del Lightbox Pantalla Completa
  const lightboxContent = previewIndex !== null && selectedCategory && (
    <div className="fixed inset-0 z-[99999] bg-white/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn" onClick={() => setPreviewIndex(null)}>
      
      <button
        onClick={() => setPreviewIndex(null)}
        className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full bg-slate-200 hover:bg-slate-300 text-black flex items-center justify-center transition-colors cursor-pointer shadow-lg"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      <div className="absolute top-4 left-4 z-50">
        <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full shadow-xs">
          {selectedCategory.name} ({previewIndex + 1} / {selectedCategory.count})
        </span>
      </div>

      <div className="relative w-full max-w-5xl h-full flex items-center justify-center px-8 sm:px-16" onClick={(e) => e.stopPropagation()}>
        {previewIndex > 0 && (
          <button
            onClick={() => setPreviewIndex(previewIndex - 1)}
            className="absolute left-1 sm:left-4 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-200/90 hover:bg-slate-300 text-black flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-110"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
          </button>
        )}

        <div className="flex items-center justify-center w-full h-full max-h-[82vh]">
          <img
            src={`/skins/skin-${selectedCategory.prefix}-${(previewIndex + 1).toString().padStart(2, "0")}.jpg`}
            alt="Vista ampliada del colectivo"
            className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl border border-slate-200 bg-white"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `/skins/skin-${selectedCategory.prefix}-${previewIndex + 1}.jpg`;
            }}
          />
        </div>

        {previewIndex < selectedCategory.count - 1 && (
          <button
            onClick={() => setPreviewIndex(previewIndex + 1)}
            className="absolute right-1 sm:right-4 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-200/90 hover:bg-slate-300 text-black flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-110"
          >
            <ChevronRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section className="w-full py-16 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-12">
          <div className="eyebrow-badge inline-flex items-center gap-1.5 bg-[#75AADB]/10 text-[#75AADB] border border-[#75AADB]/20 px-3.5 py-1.5 rounded-full mb-3">
            <FolderOpen className="w-4 h-4" /> Archivo de Texturas
          </div>
          <h2 className="titulo-seccion text-black mb-3">
            Colecciones por Modelo
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
            Explorá el archivo completo organizado por cada carrocería y descubrí el detalle de cada skin oficial.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 w-full">
          {collections.map((col) => (
            <div
              key={col.key}
              onClick={() => setSelectedCategory(col)}
              className="group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#75AADB]/50 transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden relative">
                <img
                  src={col.coverImg}
                  alt={col.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 right-2.5 sm:right-4 flex items-center justify-between text-white">
                  <span className="eyebrow-badge bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl">
                    {col.count} Fotos
                  </span>
                </div>
              </div>

              <div className="p-3.5 sm:p-5 flex items-center justify-between">
                <div>
                  <h3 className="titulo-card text-black group-hover:text-[#75AADB] transition-colors leading-snug">
                    {col.name}
                  </h3>
                  <p className="hidden sm:block text-xs text-slate-400 mt-0.5">Carpeta oficial de texturas</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#75AADB] group-hover:text-white group-hover:border-[#75AADB] transition-all shrink-0">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          ))}

          <a
            href="https://instagram.com/paseandoporets2"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 lg:col-span-2 group bg-slate-50 border border-slate-200 hover:border-[#75AADB] rounded-2xl sm:rounded-3xl p-5 sm:p-8 transition-all shadow-sm hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 cursor-pointer"
          >
            <div className="flex items-center gap-4 sm:gap-5 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#75AADB]/10 text-[#75AADB] border border-[#75AADB]/20 flex items-center justify-center shrink-0 group-hover:bg-[#75AADB] group-hover:text-white transition-all shadow-sm">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div>
                <h3 className="titulo-card text-black group-hover:text-[#75AADB] transition-colors mb-0.5 sm:mb-1">
                  ¿Querés algunas de estas skins?
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-600">
                  Si querés algunas de estas pinturas argentinas enviame un mensaje a mi Instagram y hablamos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white bg-black hover:bg-slate-800 py-3 px-5 sm:py-3.5 sm:px-6 rounded-xl sm:rounded-2xl shadow-md transition-all shrink-0">
              <MessageCircle className="w-4 h-4" /> Hablar por Instagram
            </div>
          </a>
        </div>

        {mounted && createPortal(
          <>
            {modalContent}
            {lightboxContent}
          </>,
          document.body
        )}

      </div>
    </section>
  );
}