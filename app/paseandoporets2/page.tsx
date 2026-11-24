"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bus, MapPin, Navigation, Calendar, Clock, ChevronRight, ChevronLeft, 
  Flame, Trophy, MessageCircle, PlaySquare, ExternalLink, Globe2, Sparkles, FolderOpen, Heart, Star, ChevronDown, ArrowRight, CheckCircle2, Users, ArrowUp 
} from "lucide-react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getCountFromServer, onSnapshot, orderBy, limit } from "firebase/firestore";
import GloboCeibo from "./components/GloboCeibo";
import { COORDENADAS } from "./components/ciudades-geo";
import ETS2SkinHeroClean from "./components/ETS2SkinHeroClean";
import ETS2Collections from "./components/ETS2Collections";
import ScrollHero from "./components/ScrollHero";
import CookieBanner from "./components/CookieBanner";
import MobileMenu from "./components/MobileMenu";

const SINONIMOS_CIUDADES: Record<string, string> = {
  "baires": "Buenos Aires",
  "bs as": "Buenos Aires",
  "capital federal": "Buenos Aires",
  "caba": "Buenos Aires",
  "cordoba": "Córdoba",
  "parana": "Paraná",
  "mendoza": "Mendoza Capital",
  "neuquen": "Neuquén Capital",
  "jujuy": "San Salvador de Jujuy",
  "salta": "Salta Capital",
  "tucuman": "San Miguel de Tucumán",
  "catamarca": "San Fernando del Valle de Catamarca",
  "salta capital": "Salta Capital",
  "bariloche": "San Carlos de Bariloche",
  "rosario": "Rosario",
  "america": "América",
  "madryn": "Puerto Madryn",
};

const zonasCeibo = {
  "Noroeste Argentino (NOA)": {
    ciudades: [
      "San Salvador de Jujuy", "Palpalá", "Perico", "Pampa Blanca",
      "Salta Capital", "General Güemes", "San José de Metán", "Rosario de la Frontera",
      "San Miguel de Tucumán", "Pozo Hondo", "Termas de Río Hondo", 
      "Santiago del Estero", "La Banda", "Fernández", "Herrera", "Añatuya", 
      "Colonia Dora", "Icaño", "Pinto", "Bandera", "Loreto", "Villa Ojo de Agua", 
      "Villa de María del Río Seco", "San Fernando del Valle de Catamarca", 
      "Chumbicha", "San Martín (Catamarca)", "La Rioja", 
      "Patquía", "Chamical"
    ],
    empresas: ["Flechabus", "Via Tac/Bariloche", "Balut", "Veloz del Norte", "Andesmar", "Urquiza", "20 de Junio", "El Práctico", "Elijo yo"],
    coords: { x: "42%", y: "15%" }
  },
  "Litoral y Mesopotamia": {
    ciudades: [
      "Puerto Iguazú", "Wanda", "Eldorado", 
      "Jardín América", "San Ignacio", "Santa Ana", "Posadas", "Gobernador Virasoro", 
      "Santo Tomé (Cts.)", "General Alvear (Cts.)", "Paso de los Libres", "Monte Caseros", "Mocoretá", 
      "Chajarí", "Federación", "Concordia", "San Salvador", "Ubajay", "Colón", 
      "San José", "Concepción del Uruguay", "Gualeguaychú", "Villaguay", "Viale", "Paraná",
    ],
    empresas: ["Via Tac/Bariloche", "Platabus","20 de Junio","Crucero del Norte", "Crucero del Sur", "Crucero del Este", "Rio Uruguay", "Flechabus", "Singer", "Ersa", "Elijo yo"],
    coords: { x: "74%", y: "24%" }
  },
  "Provincia de Santa Fe": {
    ciudades: [
      "Reconquista", "Malabrigo", "Vera", "Margarita", "Gobernador Crespo", 
      "San Justo (S.Fe)", "Nelson", "Tostado", "Ceres (parador)", "Arrufó", "Sunchales", 
      "Rafaela", "Ciudad de Santa Fe", "Santo Tomé (S.Fe)", "Coronda", 
      "San Vicente (S.Fe)", "San Martín de las Escobas", "Cañada Rosquín", 
      "San Genaro", "Totoras", "San Lorenzo (S.Fe)", "Rosario", "Pérez", 
      "Casilda", "Firmat", "Venado Tuerto", "Rufino"
    ],
    empresas: ["Chevallier", "El Pulqui", "El Norte/Norte Bis", "Zenit", "Flechabus", "20 de Junio", "La Veloz del Norte", "Balut", "Elijo Yo"],
    coords: { x: "61%", y: "37%" }
  },
  "Provincia de Córdoba": {
    ciudades: [
      "San José de la Dormida", "Quilino", "Dean Funes", "Cruz del Eje", 
      "Serrezuela", "Villa de Soto", "Capilla del Monte", "La Cumbre", 
      "Villa Giardino", "La Falda", "Cosquín", "San Roque", "Villa Carlos Paz", 
      "Alta Gracia", "Villa General Belgrano", "Santa Rosa de Calamuchita", 
      "Embalse", "Almafuerte", "Córdoba", "Malvinas Argentinas", "Río Primero", 
      "Pedro Arroyito", "San Francisco", "Las Varillas", "Villa María", 
      "Río Segundo", "Jesús María", "Villa del Totoral", "General Deheza", 
      "General Cabrera", "Río Cuarto", "Reduccion", "La Carlota", "Arias", 
      "Sampacho", "Vicuña Mackenna", "Laboulaye"
    ],
    empresas: ["Buses Lep", "Platabus", "Sierras de Córdoba", "Urquiza", "Fono Bus", "Flechabus", "El Práctico", "20 de Junio", "Balut", "La Veloz del Norte", "Elijo Yo", "Via Tac/Bariloche"],
    coords: { x: "51%", y: "41%" }
  },
  "Cuyo y La Pampa": {
    ciudades: [
      "Mendoza Capital", "San Martín", "La Paz, Mza", "Desaguadero", "San Luis", "Villa Mercedes", "Justo Daract", "Unión", 
      "Nueva Galia", "General Alvear", "Realicó", "General Pico", "Santa Rosa", 
      "Catriló", "Macachín", "General Acha", "Puelches", "Casa de Piedra", 
      "Santa Isabel",
    ],
    empresas: ["Andesmar", "PlataBus", "Cata Internacional", "Autotransportes San Juan", "Dumascat", "La Union", "Flecha Bus", "Via Tac", "Elijo Yo", "20 de Junio"],
    coords: { x: "36%", y: "46%" }
  },
  "Buenos Aires (Interior y Costa)": {
    ciudades: [
      "San Nicolás de los Arroyos", "San Pedro (B.A.)", "Baradero", "Zárate", 
      "Campana", "Junín", "Vedia", "General Villegas", 
      "América", "Trenque Lauquen", "Pehuajó", "Carlos Casares", "9 de Julio", 
      "Bragado", "San Andrés de Giles", 
      "Mercedes", "Suipacha", "Chivilcoy", "Chacabuco", "Rivera", "Carhué", 
      "Guaminí", "Laguna Alsina", "Olavarría", "Azul", 
      "Chillar", "Las Flores", "Lobos", 
      "San Miguel del Monte", "General Belgrano", "Ranchos", "Chascomús", 
      "Castelli", "Dolores", "Coronel Vidal", "Ayacucho", "Rauch", "Tandil", 
      "Mar del Plata", "Necochea", "Adolfo Gonzales Chaves", "Tres Arroyos", 
      "Coronel Dorrego", "Bahía Blanca", "Punta Alta", 
      "Médanos", "Mayor Buratovich", "Pedro Luro", "Villalonga", "Stroeder", 
      "Carmen de Patagones"
    ],
    empresas: ["Plusmar", "Cóndor Estrella", "Chevallier", "Tony Tur", "Vía Tac", "Elijo Yo", "Platabus"],
    coords: { x: "69%", y: "58%" }
  },
  "Buenos Aires (AMBA)": {
    ciudades: [
      "Tigre", "El Talar", "Pablo Nogués", "Pilar", "Luján", "Moreno", "Merlo", 
      "Morón", "Liniers", "Tapiales", 
      "Lomas de Zamora", "Dellepiane", "Retiro", "Avellaneda", 
      "Quilmes", "Florencio Varela", "La Plata", "Coronel Brandsen", 
      "Aeroparque Jorge Newbery", "Buenos Aires"
    ],
    empresas: ["Chevallier", "Plusmar", "Urquiza", "Flechabus", "Vía Bariloche", "20 de Junio", "Elijo Yo", "Balut", "La Veloz del Norte", "Platabus"],
    coords: { x: "72%", y: "47%" }
  },
  "Patagonia": {
    ciudades: [
      "Zapala", "Cutral Có", "Plottier", "Neuquén Capital", "Junín de los Andes", 
      "San Martín de los Andes", "Piedra del Águila", "Choele Choel", 
      "Río Colorado", "General Conesa", "San Antonio Oeste", "Las Grutas", "Sierra Grande", "Puerto Madryn", "Viedma", 
      "Catriel", "Cipolletti", "General Roca", "Villa Regina", 
      "San Carlos de Bariloche"
    ],
    empresas: ["Vía Bariloche/Tac", "Andesmar", "Chevallier", "Albus", "Flecha Bus", "Don Otto", "Ceferino"],
    coords: { x: "38%", y: "73%" }
  },
  "Uruguay": {
    ciudades: [
      "Fray Bentos", "Mercedes (UY)"
    ],
    empresas: ["EGA", "Flechabus"],
    coords: { x: "78%", y: "44%" }
  }
};

const coordenadasMapaPreciso: Record<string, { x: number; y: number }> = {
  "San Salvador de Jujuy": { x: 42, y: 11 }, "Palpalá": { x: 42.5, y: 12 }, "Perico": { x: 43, y: 12.5 }, "Pampa Blanca": { x: 43.5, y: 13 },
  "Salta Capital": { x: 42, y: 16 }, "General Güemes": { x: 43.5, y: 16 }, "San José de Metán": { x: 43.5, y: 19 }, "Rosario de la Frontera": { x: 43.5, y: 20.5 },
  "San Miguel de Tucumán": { x: 44, y: 23 }, "Pozo Hondo": { x: 47, y: 23 }, "Termas de Río Hondo": { x: 45.5, y: 24.5 },
  "Santiago del Estero": { x: 48, y: 26 }, "La Banda": { x: 49, y: 26.5 }, "Fernández": { x: 50.5, y: 28 }, "Herrera": { x: 51.5, y: 29.5 },
  "Añatuya": { x: 53, y: 31 }, "Colonia Dora": { x: 53, y: 32.5 }, "Icaño": { x: 53.5, y: 33.5 }, "Pinto": { x: 54.5, y: 35 }, "Bandera": { x: 56.5, y: 35 },
  "Loreto": { x: 48, y: 29 }, "Villa Ojo de Agua": { x: 49.5, y: 34 }, "Villa de María del Río Seco": { x: 48.5, y: 32 },
  "San Fernando del Valle de Catamarca": { x: 38, y: 27 }, "Chumbicha": { x: 37, y: 29.5 }, "San Martín (Catamarca)": { x: 39, y: 29.5 },
  "La Rioja": { x: 34, y: 32 }, "Patquía": { x: 33, y: 35 }, "Chamical": { x: 36, y: 36 },

  "Puerto Iguazú": { x: 81, y: 10 }, "Wanda": { x: 80, y: 12 }, "Eldorado": { x: 79, y: 14 }, "Jardín América": { x: 78, y: 17 },
  "San Ignacio": { x: 77, y: 18.5 }, "Santa Ana": { x: 77, y: 19.5 }, "Posadas": { x: 76, y: 21 }, "Gobernador Virasoro": { x: 77, y: 24 },
  "Santo Tomé (Cts.)": { x: 78, y: 27 }, "Paso de los Libres": { x: 77, y: 33 }, "Monte Caseros": { x: 76, y: 38 }, "Mocoretá": { x: 75, y: 40 },
  "Chajarí": { x: 74, y: 41.5 }, "Federación": { x: 74, y: 43 }, "Concordia": { x: 73, y: 45.5 }, "San Salvador": { x: 71, y: 46.5 },
  "Ubajay": { x: 72.5, y: 48 }, "Colón": { x: 72.5, y: 50 }, "San José": { x: 71.5, y: 51 }, "Concepción del Uruguay": { x: 71.5, y: 53 },
  "Villaguay": { x: 67, y: 47.5 }, "Viale": { x: 62.5, y: 49 }, "Paraná": { x: 61, y: 49.5 }, "Gualeguaychú": { x: 72, y: 51.5 }, "General Alvear (Cts.)": { x: 76.5, y: 44.5 },

  "Reconquista": { x: 61, y: 29 }, "Malabrigo": { x: 60, y: 30.5 }, "Vera": { x: 59, y: 32 }, "Margarita": { x: 59, y: 33.5 },
  "Gobernador Crespo": { x: 59, y: 36 }, "San Justo (S.Fe)": { x: 59, y: 39 }, "Nelson": { x: 59.5, y: 42 }, "Tostado": { x: 52, y: 27 },
  "Ceres (parador)": { x: 53.5, y: 31 }, "Arrufó": { x: 55, y: 32.5 }, "Sunchales": { x: 56.5, y: 37 }, "Rafaela": { x: 56.5, y: 40 },
  "Ciudad de Santa Fe": { x: 62.5, y: 49.5 }, "Santo Tomé (S.Fe)": { x: 62.5, y: 51 }, "Coronda": { x: 62.5, y: 53.5 },
  "San Vicente (S.Fe)": { x: 57.5, y: 44 }, "San Martín de las Escobas": { x: 57.5, y: 45.5 }, "Cañada Rosquín": { x: 57.5, y: 47 },
  "San Genaro": { x: 59, y: 49 }, "Totoras": { x: 59, y: 51 }, "San Lorenzo (S.Fe)": { x: 62, y: 53.5 }, "Rosario": { x: 63, y: 55.5 },
  "Pérez": { x: 62, y: 56 }, "Casilda": { x: 60.5, y: 57.5 }, "Firmat": { x: 59.5, y: 59.5 }, "Venado Tuerto": { x: 57, y: 63 }, "Rufino": { x: 53, y: 66 },

  "San José de la Dormida": { x: 47, y: 35 }, "Quilino": { x: 44.5, y: 34 }, "Dean Funes": { x: 44.5, y: 35.5 }, "Cruz del Eje": { x: 42, y: 37.5 },
  "Serrezuela": { x: 39.5, y: 36.5 }, "Villa de Soto": { x: 40.5, y: 38 }, "Capilla del Monte": { x: 43.5, y: 39 }, "La Cumbre": { x: 43.5, y: 40.5 },
  "Villa Giardino": { x: 43.5, y: 42 }, "La Falda": { x: 43.5, y: 43.5 }, "Cosquín": { x: 44.5, y: 45 }, "San Roque": { x: 45.5, y: 46.5 },
  "Villa Carlos Paz": { x: 45, y: 48 }, "Alta Gracia": { x: 45, y: 51 }, "Villa General Belgrano": { x: 45, y: 54 }, "Santa Rosa de Calamuchita": { x: 45, y: 55.5 },
  "Embalse": { x: 46.5, y: 57 }, "Almafuerte": { x: 47.5, y: 57 }, "Córdoba": { x: 47.5, y: 46 }, "Malvinas Argentinas": { x: 49, y: 46 },
  "Río Primero": { x: 51.5, y: 46 }, "Pedro Arroyito": { x: 54, y: 46 }, "San Francisco": { x: 58, y: 46 }, "Las Varillas": { x: 56, y: 50 },
  "Villa María": { x: 52, y: 52 }, "Río Segundo": { x: 49, y: 48 }, "Jesús María": { x: 47, y: 42 }, "Villa del Totoral": { x: 47, y: 39 },
  "General Deheza": { x: 52, y: 55 }, "General Cabrera": { x: 52, y: 56.5 }, "Río Cuarto": { x: 50, y: 60 }, "Reduccion": { x: 52, y: 60 },
  "La Carlota": { x: 54.5, y: 62 }, "Arias": { x: 58.5, y: 63.5 }, "Sampacho": { x: 47, y: 61.5 }, "Vicuña Mackenna": { x: 48, y: 64.5 },
  "Laboulaye": { x: 53.5, y: 67 },

  "Desaguadero": { x: 34, y: 57 }, "San Luis": { x: 38, y: 58 }, "Villa Mercedes": { x: 43.5, y: 60 }, "Justo Daract": { x: 46, y: 61.5 },
  "Unión": { x: 43.5, y: 68.5 }, "Nueva Galia": { x: 44.5, y: 71.5 }, "General Alvear": { x: 34, y: 67.5 }, "Realicó": { x: 49.5, y: 68.5 },
  "General Pico": { x: 51.5, y: 71.5 }, "Santa Rosa": { x: 50.5, y: 79.5 }, "Catriló": { x: 54.5, y: 79.5 }, "Macachín": { x: 52, y: 82.5 },
  "General Acha": { x: 47, y: 84 }, "Puelches": { x: 44.5, y: 88.5 }, "Casa de Piedra": { x: 42, y: 91.5 }, "Santa Isabel": { x: 39, y: 80.5 },
  "La Paz": { x: 35.5, y: 57 }, 
  "San Martín": { x: 36.5, y: 58 }, 
  "Mendoza Capital": { x: 35, y: 58.5 },

  "San Nicolás de los Arroyos": { x: 65, y: 54.5 }, "San Pedro (B.A.)": { x: 66.5, y: 56 }, "Baradero": { x: 67.5, y: 57.5 }, "Zárate": { x: 69, y: 59 },
  "Campana": { x: 70, y: 60.5 }, "Junín": { x: 61, y: 60.5 }, "Vedia": { x: 59, y: 60.5 }, "General Villegas": { x: 54, y: 63.5 },
  "América": { x: 54, y: 66.5 }, "Trenque Lauquen": { x: 55.5, y: 71 }, "Pehuajó": { x: 59.5, y: 70 }, "Carlos Casares": { x: 62, y: 68.5 },
  "9 de Julio": { x: 64.5, y: 68.5 }, "Bragado": { x: 67, y: 67 }, "San Andrés de Giles": { x: 69, y: 63.5 }, "Mercedes": { x: 70, y: 65 },
  "Suipacha": { x: 69, y: 66.5 }, "Chivilcoy": { x: 68, y: 68 }, "Chacabuco": { x: 65.5, y: 65 }, "Rivera": { x: 54, y: 78.5 },
  "Carhué": { x: 56, y: 80 }, "Guaminí": { x: 57.5, y: 81.5 }, "Laguna Alsina": { x: 59, y: 81.5 }, "Olavarría": { x: 67.5, y: 76.5 },
  "Azul": { x: 69.5, y: 78 }, "Chillar": { x: 68.5, y: 80.5 }, "Las Flores": { x: 72.5, y: 74.5 }, "Lobos": { x: 72.5, y: 69 },
  "San Miguel del Monte": { x: 73.5, y: 70.5 }, "General Belgrano": { x: 74.5, y: 73 }, "Ranchos": { x: 75.5, y: 71.5 }, "Chascomús": { x: 77, y: 71.5 },
  "Castelli": { x: 78, y: 74.5 }, "Dolores": { x: 79, y: 76 }, "Coronel Vidal": { x: 80, y: 81.5 }, "Ayacucho": { x: 76.5, y: 80 },
  "Rauch": { x: 74, y: 79 }, "Tandil": { x: 71.5, y: 81.5 }, "Mar del Plata": { x: 80, y: 84.5 }, "Necochea": { x: 74.5, y: 89 },
  "Adolfo Gonzales Chaves": { x: 70, y: 86.5 }, "Tres Arroyos": { x: 69, y: 88 }, "Coronel Dorrego": { x: 65.5, y: 88 }, "Bahía Blanca": { x: 61, y: 89.5 },
  "Punta Alta": { x: 62.5, y: 91 }, "Médanos": { x: 59, y: 91 }, "Mayor Buratovich": { x: 59, y: 92.5 }, "Pedro Luro": { x: 58, y: 94 },
  "Villalonga": { x: 58, y: 96.5 }, "Stroeder": { x: 59, y: 98 }, "Carmen de Patagones": { x: 60, y: 99.5 },

  "Tigre": { x: 70.5, y: 62 }, "El Talar": { x: 70.5, y: 63.5 }, "Pablo Nogués": { x: 71.5, y: 63.5 }, "Pilar": { x: 70.5, y: 65 },
  "Luján": { x: 69.5, y: 65 }, "Moreno": { x: 70.5, y: 66.5 }, "Merlo": { x: 71.5, y: 66.5 }, "Morón": { x: 72.5, y: 65 },
  "Liniers": { x: 73.5, y: 65 }, "Tapiales": { x: 73.5, y: 66.5 }, "Lomas de Zamora": { x: 74.5, y: 66.5 }, "Dellepiane": { x: 74.5, y: 65 },
  "Retiro": { x: 75.5, y: 63.5 }, "Avellaneda": { x: 75.5, y: 65 }, "Quilmes": { x: 76.5, y: 66.5 }, "Florencio Varela": { x: 75.5, y: 68 },
  "La Plata": { x: 77.5, y: 68 }, "Coronel Brandsen": { x: 76.5, y: 69.5 }, "Aeroparque Jorge Newbery": { x: 75.5, y: 62 }, "Buenos Aires": { x: 74.5, y: 63.5 },

  "Zapala": { x: 34, y: 91 }, "Cutral Có": { x: 36, y: 92.5 }, "Plottier": { x: 40, y: 94 }, "Neuquén Capital": { x: 41.5, y: 94.5 }, "Junín de los Andes": { x: 32, y: 96.5 },
  "San Martín de los Andes": { x: 32, y: 98 }, "Piedra del Águila": { x: 38, y: 98 }, "Choele Choel": { x: 51, y: 95 },
  "Río Colorado": { x: 56.5, y: 92.5 }, "General Conesa": { x: 58, y: 98 }, "San Antonio Oeste": { x: 54, y: 99.5 }, "Viedma": { x: 62, y: 99.5 },
  "Catriel": { x: 44, y: 89 }, "Cipolletti": { x: 42, y: 94 }, "General Roca": { x: 45, y: 94 }, "Villa Regina": { x: 47, y: 94 },
  "San Carlos de Bariloche": { x: 31, y: 102 },
  
  "Las Grutas": { x: 53.5, y: 101.5 }, 
  "Sierra Grande": { x: 53, y: 105 }, 
  "Puerto Madryn": { x: 54.5, y: 109 },

  "Fray Bentos": { x: 73.5, y: 55 }, "Mercedes (UY)": { x: 75.5, y: 56.5 },
};

const todasLasCiudades = Object.entries(zonasCeibo)
  .flatMap(([zona, data]) =>
    data.ciudades.map((nombreCiudad, index) => {
      const centroX = Number.parseFloat(data.coords.x);
      const centroY = Number.parseFloat(data.coords.y);
      const desplazamiento = ((index % 5) - 2) * 1.15;
      return {
        n: nombreCiudad,
        zona,
        empresas: data.empresas,
        ...(coordenadasMapaPreciso[nombreCiudad] || {
          x: centroX + desplazamiento,
          y: centroY + ((Math.floor(index / 5) % 5) - 2) * 1.15,
        }),
      };
    })
  );

const listaCiudadesUnicas = Array.from(new Set(todasLasCiudades.map(c => c.n))).sort();

const getEmpresasPorCiudad = (ciudadNombre: string): string[] => {
  const encontrada = todasLasCiudades.find(c => c.n.toLowerCase() === ciudadNombre.toLowerCase());
  return encontrada ? encontrada.empresas : ["Flechabus", "Via Tac/Bariloche", "20 de Junio", "Elijo Yo"];
};

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}>
      {children}
    </div>
  );
}

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showNavbar, setShowNavbar] = useState(false);

  const [isSubscriber, setIsSubscriber] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [empresa, setEmpresa] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boletoConfirmado, setBoletoConfirmado] = useState<number | null>(null);

  const [modoSeleccionMapa, setModoSeleccionMapa] = useState<"origen" | "destino">("origen");

  const [viajesEnVivo, setViajesEnVivo] = useState<Array<{ id: string; origen: string; destino: string; empresa: string; usuario: string; estado?: string }>>([]);
  const [rankingEmpresas, setRankingEmpresas] = useState<Array<[string, number]>>([]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const mapApiRef = useRef<any>(null);
  const videosSectionRef = useRef<HTMLDivElement>(null);

  const enfocarCiudadEnMapa = (nombreCiudad: string) => {
    const coords = COORDENADAS[nombreCiudad];
    if (coords && mapApiRef.current?.ir) {
      mapApiRef.current.ir(coords[0], coords[1], 2.2);
    }
  };

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 3;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setLoading(false), 400);
      }
      setLoadingProgress(current);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!videosSectionRef.current) return;
      const rect = videosSectionRef.current.getBoundingClientRect();
      if (rect.top <= 150) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const q = query(
        collection(db, "viajes_ceibo"), 
        orderBy("fechaCreacion", "asc"), 
        limit(50) 
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs: any[] = [];
        const conteoEmpresas: Record<string, number> = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          docs.push({ id: doc.id, ...data });
          if (data.empresa) {
            const empCruda = data.empresa.trim();
            conteoEmpresas[empCruda] = (conteoEmpresas[empCruda] || 0) + 1;
          }
        });

        setViajesEnVivo(docs);
        const sortedRanking = Object.entries(conteoEmpresas).sort((a, b) => b[1] - a[1]);
        setRankingEmpresas(sortedRanking);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error al cargar los viajes:", error);
    }
  }, []);
  
  const [videosYoutube, setVideosYoutube] = useState<Array<{ titulo: string; link: string; miniatura: string }>>([
        {
      titulo: "VIEDMA - PUERTO MADRYN, BIENVENIDO CHUBUT AL MAPA!🚌🗺️ LO NUEVO DEL MAPA CEIBO🚍#ets2 1.62",
      link: "https://www.youtube.com/watch?v=C5rQghRJn_g",
      miniatura: "https://img.youtube.com/vi/C5rQghRJn_g/maxresdefault.jpg"
    },
    {
      titulo: "CONCORDIA - POSADAS CON EL LECHERO DE VIA! 🚌 ENTRANDO A TODOS LADOS EN MAPA CEIBO🚍",
      link: "https://www.youtube.com/watch?v=dTHK7O7QrQU",
      miniatura: "https://img.youtube.com/vi/dTHK7O7QrQU/maxresdefault.jpg"
    },
    {
      titulo: "BUENOS AIRES - SAN LUIS CON CATA! 🚌POR EL TALAR Y PILAR, DRIFTEANDO POR EL MAPA CEIBO + LA LLUVIA🚍⛈️",
      link: "https://www.youtube.com/watch?v=SVBar1-ijvU",
      miniatura: "https://img.youtube.com/vi/SVBar1-ijvU/maxresdefault.jpg"
    },
    {
      titulo: "LINIERS - 9 DE JULIO CON EL CHEVA! 🚌 POR PROVINCIA DE BUENOS AIRES MANEJANDO POR EL MAPA CEIBO👌🚍",
      link: "https://www.youtube.com/watch?v=fMIqO1e1GN0",
      miniatura: "https://img.youtube.com/vi/fMIqO1e1GN0/maxresdefault.jpg"
    },
    {  
      titulo: "CHOELE CHOEL - SAN ANTONIO OESTE CON LAS GRUTAS! 🚌 POR RÍO NEGRO Y PROBANDO LO NUEVO DEL CEIBO👌🚍",
      link: "https://www.youtube.com/watch?v=Creo86dMw2E",
      miniatura: "https://img.youtube.com/vi/Creo86dMw2E/maxresdefault.jpg"
    },
    { 
      titulo: "¡VIEDMA - BAHÍA BLANCA CON PLUSMAR! 🚌 VOLVIENDO DE A POCO Y PROBANDO LO NUEVO DEL CEIBO👌🚍",
      link: "https://www.youtube.com/watch?v=JtfHTFV3qIY",
      miniatura: "https://img.youtube.com/vi/JtfHTFV3qIY/maxresdefault.jpg" 
    }, 
  ]);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/youtube');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const soloLargos = data.filter((v: any) => {
            const titulo = (v.titulo || "").toLowerCase();
            return !titulo.includes("#shorts") && !titulo.includes("#short") && !titulo.includes("shorts");
          }).slice(0, 5);
          if (soloLargos.length > 0) setVideosYoutube(soloLargos);
        }
      } catch (error) { console.error("Error al obtener videos:", error); }
    }
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videosYoutube.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videosYoutube.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [videosYoutube.length]);

  const videoActual = videosYoutube[currentVideoIndex] || videosYoutube[0];
  const empresasDisponibles = getEmpresasPorCiudad(origen);

  const handleVerificarSuscripcion = () => {
    setVerificando(true);
    window.open("https://www.youtube.com/@paseandoporets2?sub_confirmation=1", "_blank");
    setTimeout(() => {
      setIsSubscriber(true);
      setVerificando(false);
    }, 2000);
  };

  const ejecutarGuardadoPasaje = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const viajesRef = collection(db, "viajes_ceibo");
      const q = query(viajesRef, where("estado", "==", "pendiente"));
      const snapshot = await getCountFromServer(q);
      const puestoEnFila = snapshot.data().count + 1;

      await addDoc(viajesRef, {
        origen, destino, empresa, estado: "pendiente", usuario: "Suscripto Canal", fechaCreacion: serverTimestamp(),
      });
      setBoletoConfirmado(puestoEnFila);
    } catch (error) {
      alert("Hubo un error al emitir el pasaje.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqList = [
    {
      q: "¿Cómo funciona la Boletería Interactiva?",
      a: "Podés tocar directamente las ciudades en el mapa 3D o escribir los nombres en los campos de origen y destino (reconoce sin tildes y abreviaturas). Al completar los datos, confirmás tu viaje para sumarlo en tiempo real a la fila de la comunidad."
    },
    {
      q: "¿De dónde se obtienen los mapas y mods?",
      a: "Utilizamos mapas y rutas oficiales de Argentina muy populares en la comunidad de simuladores (como Mapa Ceibo y Argenmap), optimizados para garantizar larga distancia y realismo puro."
    },
    {
      q: "¿Cómo participo del Muro del Pasajero Estelar?",
      a: "Cada mes destacamos a los seguidores más activos que dejan su me gusta, participan en el chat y acompañan permanentemente en los directos de YouTube, Instagram, TikTok y Facebook."
    },
    {
      q: "¿Puedo encargar skins o diseños personalizados?",
      a: "¡Sí! Todo el diseño visual, desarrollo de la plataforma y branding está a cargo de NDI | Diseño & Web. Podes consultar por trabajos profesionales en www.ndiweb.com."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-[#75AADB] selection:text-white w-full overflow-x-clip relative">
      
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>

      {loading && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full flex flex-col items-center">
            <h2 className="titulo-seccion text-slate-900 text-2xl mb-12 text-center">Bienvenidos</h2>
            <div className="w-full relative pt-4 pb-2">
              <div className="absolute -top-7 transition-all duration-75 ease-out z-20" style={{ left: `calc(${loadingProgress}% - 45px)` }}>
                <img src="/rio-uruguay.png" alt="Colectivo" className="w-24 h-auto object-contain" />
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 relative">
                <div className="bg-[#75AADB] h-full transition-all duration-75 ease-out rounded-full" style={{ width: `${loadingProgress}%` }}></div>
              </div>
            </div>
            <div className="mt-6 text-slate-400 font-mono font-medium text-xs tracking-widest uppercase">{loadingProgress}% cargando ruta...</div>
          </div>
        </div>
      )}

{/* BARRA DE NAVEGACIÓN FLOTANTE */}
<header className={`fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/85 shadow-md px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-500 ease-out ${showNavbar ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
  
  <a href="#" className="flex items-center gap-2.5 text-black font-black text-xs sm:text-sm tracking-tight truncate">
    <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl shadow-sm shrink-0" />
    <span className="titulo-card text-black text-xs sm:text-sm tracking-wide truncate">Paseando por ETS 2</span>
  </a>

  <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
    <a href="#boleteria" className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-white rounded-xl transition-all">Boletería</a>
    <a href="#catalogo" className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-white rounded-xl transition-all">Catálogo</a>
    <a href="#colecciones" className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-white rounded-xl transition-all">Colección</a>
    <a href="#fila-pasajes" className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-white rounded-xl transition-all">Comunidad</a>
  </nav>

  <div className="flex items-center gap-2 sm:gap-3">
    <MobileMenu />
    <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
      <a href="https://www.youtube.com/@paseandoporets2" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 hover:text-red-500 transition-colors" title="YouTube">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
      <a href="https://instagram.com/paseandoporets2" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 hover:text-pink-500 transition-colors" title="Instagram">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </a>
      <a href="https://tiktok.com/@paseandoporets2" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 hover:text-cyan-500 transition-colors" title="TikTok">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
      </a>
      <a href="https://www.facebook.com/paseandoporets2" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 hover:text-blue-600 transition-colors" title="Facebook">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
    </div>
  </div>
</header>

      <div className="w-full pt-2 sm:pt-4">
        <ScrollHero />
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-8 relative z-20 bg-white">
        <main className="flex flex-col gap-8 w-full mx-auto">

          <div ref={videosSectionRef}>
            <Reveal>
              <section className="flex flex-col w-full items-center">
                <div className="flex items-center justify-center mb-4 gap-2 w-full">
                  <h2 className="titulo-seccion flex items-center justify-center gap-2 text-black text-center">
                    <PlaySquare className="w-6 h-6 text-red-500 shrink-0" /> 
                    <span>ÚLTIMOS VIDEOS EN YOUTUBE</span>
                  </h2>
                </div>
                <div className="w-full relative">
                  <a href={videoActual.link} target="_blank" rel="noopener noreferrer" className="aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden relative block group shadow-md">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${videoActual.miniatura.replace('hqdefault.jpg', 'maxresdefault.jpg').replace('sddefault.jpg', 'maxresdefault.jpg')}')` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                    <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10">
                      <span className="eyebrow-badge inline-block bg-[#75AADB] text-white px-2.5 py-0.5 md:px-4 md:py-1.5 rounded-lg md:rounded-xl">NUEVOS VIDEOS</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-8">
                      <h3 className="titulo-card text-white md:text-2xl leading-snug line-clamp-2">{videoActual.titulo}</h3>
                    </div>
                  </a>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => setCurrentVideoIndex((prev) => (prev - 1 + videosYoutube.length) % videosYoutube.length)} className="bg-white/90 hover:bg-white text-black p-2 rounded-xl transition-all cursor-pointer shadow-sm">
                      <ChevronLeft className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button onClick={() => setCurrentVideoIndex((prev) => (prev + 1) % videosYoutube.length)} className="bg-white/90 hover:bg-white text-black p-2 rounded-xl transition-all cursor-pointer shadow-sm">
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </section>
            </Reveal>
          </div>

          <Reveal>
            <section className="flex flex-row gap-2 w-full">
              <a href="https://www.youtube.com/@paseandoporets2" target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 border border-slate-200 hover:border-red-500 py-2.5 px-1 rounded-2xl flex flex-col items-center text-center transition-all shadow-sm hover:scale-[1.02]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-current mb-1" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                <h4 className="eyebrow-badge text-black truncate w-full">Suscribete</h4>
              </a>
              <a href="https://instagram.com/paseandoporets2" target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 border border-slate-200 hover:border-pink-500 py-2.5 px-1 rounded-2xl flex flex-col items-center text-center transition-all shadow-sm hover:scale-[1.02]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 fill-current mb-1" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <h4 className="eyebrow-badge text-black truncate w-full">Seguime</h4>
              </a>
              <a href="https://tiktok.com/@paseandoporets2" target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 border border-slate-200 hover:border-cyan-500 py-2.5 px-1 rounded-2xl flex flex-col items-center text-center transition-all shadow-sm hover:scale-[1.02]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 fill-current mb-1" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                <h4 className="eyebrow-badge text-black truncate w-full">Seguime</h4>
              </a>
              <a href="https://www.facebook.com/paseandoporets2" target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 border border-slate-200 hover:border-blue-600 py-2.5 px-1 rounded-2xl flex flex-col items-center text-center transition-all shadow-sm hover:scale-[1.02]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 fill-current mb-1" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <h4 className="eyebrow-badge text-black truncate w-full">Seguime</h4>
              </a>
            </section>
          </Reveal>

          <Reveal>
            <section id="boleteria" className="bg-white text-slate-900 p-4 sm:p-6 md:p-10 rounded-3xl border border-slate-200 relative overflow-hidden flex flex-col gap-6 shadow-sm w-full">
              <div className="text-center relative z-10">
                <div className="eyebrow-badge inline-flex items-center gap-1.5 bg-[#75AADB]/10 text-[#75AADB] border border-[#75AADB]/20 px-3.5 py-1.5 rounded-full mb-2">
                  <Globe2 className="w-3.5 h-3.5" /> Centro de Operaciones y Rutas - Argentina
                </div>
                <h3 className="titulo-seccion text-black mb-1.5">Boletería Paseando por ETS 2</h3>
                <p className="text-slate-600 text-[11px] sm:text-xs md:text-sm max-w-xl mx-auto">Seleccioná tu origen y destino tocando el mapa o escribiendo abajo.</p>

                <div className="flex flex-row justify-center gap-2 mt-3">
                  <button type="button" onClick={() => setModoSeleccionMapa("origen")} className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-2xl border ${modoSeleccionMapa === "origen" ? "bg-[#75AADB] text-white border-[#75AADB] shadow-md" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    <MapPin className="w-3.5 h-3.5" /> <span className="truncate">Origen {origen ? `(${origen})` : ""}</span>
                  </button>
                  <button type="button" onClick={() => setModoSeleccionMapa("destino")} className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-2xl border ${modoSeleccionMapa === "destino" ? "bg-red-500 text-white border-red-500 shadow-md" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    <MapPin className="w-3.5 h-3.5" /> <span className="truncate">Destino {destino ? `(${destino})` : ""}</span>
                  </button>
                </div>
              </div>

              <div className="relative h-[480px] sm:h-[550px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-sky-50 md:h-[720px] shadow-inner">
                <GloboCeibo
                  ref={mapApiRef}
                  ciudades={todasLasCiudades}
                  origen={origen}
                  destino={destino}
                  modoSeleccionMapa={modoSeleccionMapa}
                  onSelectCity={(ciudad) => {
                    if (modoSeleccionMapa === "origen") {
                      setOrigen(ciudad);
                      setEmpresa("");
                      if (ciudad === destino) setDestino("");
                    } else {
                      setDestino(ciudad);
                    }
                    enfocarCiudadEnMapa(ciudad);
                  }}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#75AADB]" /> Origen
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Jujuy, baires, america..." 
                      className="w-full bg-white border border-slate-300 text-black p-3 rounded-2xl text-xs sm:text-sm outline-none font-bold shadow-sm focus:border-[#75AADB]"
                      value={origen}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOrigen(val);

                        const limpio = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        let encontrada = SINONIMOS_CIUDADES[limpio];

                        if (!encontrada) {
                          encontrada = listaCiudadesUnicas.find(
                            c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === limpio
                          ) || "";
                        }

                        if (encontrada) {
                          setOrigen(encontrada);
                          setEmpresa("");
                          if (encontrada === destino) setDestino("");
                          enfocarCiudadEnMapa(encontrada);
                        }
                      }}
                      list="ciudades-origen-sugerencias"
                    />
                    <datalist id="ciudades-origen-sugerencias">
                      {listaCiudadesUnicas.map((c) => (<option key={c} value={c} />))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> Destino
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: bariloche, salta, america..." 
                      className="w-full bg-white border border-slate-300 text-black p-3 rounded-2xl text-xs sm:text-sm outline-none font-bold shadow-sm focus:border-red-500"
                      value={destino}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDestino(val);

                        const limpio = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        let encontrada = SINONIMOS_CIUDADES[limpio];

                        if (!encontrada) {
                          encontrada = listaCiudadesUnicas.find(
                            c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === limpio
                          ) || "";
                        }

                        if (encontrada) {
                          setDestino(encontrada);
                          enfocarCiudadEnMapa(encontrada);
                        }
                      }}
                      list="ciudades-destino-sugerencias"
                    />
                    <datalist id="ciudades-destino-sugerencias">
                      {listaCiudadesUnicas.map((c) => (<option key={c} value={c} />))}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-amber-500" /> Empresa
                    </label>
                    <select className="w-full bg-white border border-slate-300 text-black p-3 rounded-2xl text-xs sm:text-sm outline-none cursor-pointer font-bold shadow-sm" value={empresa} onChange={(e) => setEmpresa(e.target.value)} disabled={!origen}>
                      <option value="" disabled>Seleccioná empresa...</option>
                      {empresasDisponibles.map((emp) => (<option key={emp} value={emp}>{emp}</option>))}
                    </select>
                  </div>
                </div>
              </div>

            {origen && destino && empresa ? (
              !isSubscriber ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto animate-fadeIn w-full shadow-sm">
                  <Users className="w-10 h-10 text-[#75AADB] mx-auto mb-2.5" />
                  <h3 className="titulo-card text-black mb-1.5">¡Ruta lista! Suscribite al canal para continuar</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3.5">Para confirmar tu pasaje en la fila de suscriptores, debés estar suscripto a Paseando por ETS 2.</p>
                  <button type="button" onClick={handleVerificarSuscripcion} disabled={verificando} className="w-full bg-black text-white border border-black hover:bg-slate-800 font-bold py-3 px-5 rounded-xl transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm shadow-md">
                    {verificando ? "Verificando suscripción..." : "Suscribirme y Verificar en YouTube"}
                  </button>
                </div>
              ) : boletoConfirmado !== null ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-emerald-200 text-center max-w-xl mx-auto animate-fadeIn w-full shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5" />
                  <h3 className="titulo-seccion text-emerald-600 mb-1.5">¡Pasaje Confirmado N° {boletoConfirmado}!</h3>
                  <p className="text-[11px] sm:text-xs text-slate-600">Tu viaje de <b>{origen}</b> a <b>{destino}</b> con <b>{empresa}</b> ya está registrado en la base de datos.</p>
                </div>
              ) : (
                <form onSubmit={ejecutarGuardadoPasaje} className="max-w-xl mx-auto animate-fadeIn w-full">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white border border-black hover:bg-slate-800 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm shadow-md">
                    {isSubmitting ? "Emitiendo pasaje..." : "Confirmar Pasaje y Entrar a la Fila"} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )
            ) : (
              <div className="text-center text-[10px] sm:text-xs font-medium text-slate-600 py-3 px-4 bg-slate-50 rounded-2xl max-w-2xl mx-auto border border-slate-200 w-full shadow-sm leading-relaxed">
                ℹ️ Los viajes se realizarán por fila según los que vayan pidiendo. Si hay actualización del mapa se va a retrasar los videos para mostrar lo nuevo del mapa.
              </div>
            )}
            </section>
          </Reveal>

          <Reveal>
            <div id="catalogo">
              <ETS2SkinHeroClean />
            </div>
          </Reveal>

          <Reveal>
            <div id="colecciones">
              <ETS2Collections />
            </div>
          </Reveal>

          <div id="fila-pasajes" className="w-full h-1 -mt-6"></div>

          <div className="w-full max-w-6xl mx-auto mt-12 mb-6 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-[#75AADB] rounded-full"></div>
              <h2 className="titulo-seccion text-black">
                COMUNIDAD
              </h2>
            </div>
          </div>

{/* FILA EN VIVO & RANKING */}
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mt-2">
            
            <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col gap-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="titulo-seccion flex items-center gap-2 text-black">
                  <Flame className="w-5 h-5 text-amber-500" /> PASAJES DE LA COMUNIDAD
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pedidos de suscriptores. (Si piden mas de 2 veces, no se realizara los siguientes pedidos)
                </p>
              </div>

{/* 1. SECCIÓN DE VIAJES PENDIENTES (Límite 12) */}
<div className="flex flex-col gap-2 mt-1">
  {viajesEnVivo.filter(v => v.estado !== "realizado" && v.estado !== "completado").length > 0 ? (
    viajesEnVivo
      .filter(v => v.estado !== "realizado" && v.estado !== "completado")
      .slice(0, 12)
      .map((v, idx) => (
        <div key={v.id} className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#75AADB]/10 text-[#75AADB] border border-[#75AADB]/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-bold text-black flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#75AADB]" /> {v.origen} <ArrowRight className="w-3 h-3 text-slate-400" /> {v.destino}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Empresa: <b>{v.empresa}</b></span>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Confirmado</span>
        </div>
      ))
  ) : (
    <div className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
      Aún no hay pasajes emitidos hoy. ¡Sé el primero en armar tu ruta!
    </div>
  )}
</div>

{/* 2. SECCIÓN ABAJO: VIAJES HECHOS */}
<div className="mt-6 pt-4 border-t border-slate-200">
  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Viajes Hechos
  </h4>
  <div className="flex flex-col gap-2">
    {viajesEnVivo.filter(v => v.estado === "realizado" || v.estado === "completado").length > 0 ? (
      viajesEnVivo
        .filter(v => v.estado === "realizado" || v.estado === "completado")
        .map((v) => (
          <div key={v.id} className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between opacity-85">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">✓</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  {v.origen} <ArrowRight className="w-3 h-3 text-slate-400" /> {v.destino}
                </span>
                <span className="text-[10px] text-slate-500">Empresa: {v.empresa}</span>
              </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completado</span>
        </div>
      ))
    ) : (
      <div className="text-center py-3 text-[11px] text-slate-400 bg-slate-100/50 border border-dashed border-slate-200 rounded-xl">
        Todavía no se marcó ningún viaje como realizado.
      </div>
    )}
  </div>
</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col gap-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="titulo-seccion flex items-center gap-2 text-black">
                  <Trophy className="w-5 h-5 text-amber-500" /> RANKING DE EMPRESAS
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Empresas mas elegidas por los suscriptores.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                {rankingEmpresas.length > 0 ? (
                  rankingEmpresas.slice(0, 10).map(([empresaNombre, total], idx) => (
                    <div key={empresaNombre} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-black">{empresaNombre}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#75AADB] bg-[#75AADB]/10 px-2.5 py-0.5 rounded-lg">
                        {total} {total === 1 ? 'pasaje' : 'pasajes'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                    Esperando registros para calcular el ranking...
                  </div>
                )}
              </div>
            </div>

          </div>
        </Reveal>

        <Reveal>
          <div id="donacion" className="bg-slate-50 border border-slate-200 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-sm mt-2 flex flex-col items-center text-center gap-5 max-w-4xl mx-auto w-full">
            <div className="eyebrow-badge inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 px-3.5 py-1 rounded-full">
              🎯 ¡Objetivo en Ruta!
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="titulo-seccion text-black">¡Ayudanos a mantener las rutas y sorteamos el Mapa Ceibo!</h3>
            </div>

            <div className="w-full bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Progreso:</span>
                <span className="text-[#75AADB] font-mono">0%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-[#75AADB] h-full rounded-full" style={{ width: "0%" }}></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cada que la comunidad llega a la meta sorteamos el mapa ceibo. 🇦🇷🗺️
              </p>
            </div>

            <a
              href="https://link.mercadopago.com.ar/paseandoporets"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#75AADB] hover:bg-[#5b90c2] text-white font-bold py-3 px-7 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
            >
              Donar
            </a>
          </div>
        </Reveal>

        <Reveal>
          <section className="bg-slate-50 border border-slate-200 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-sm mt-2 flex flex-col gap-5 max-w-4xl mx-auto w-full">
            <div className="text-center max-w-xl mx-auto mb-1">
              <span className="eyebrow-badge text-[#75AADB] bg-[#75AADB]/10 px-2.5 py-0.5 rounded-full">Dudas Frecuentes</span>
              <h3 className="titulo-seccion text-black mt-1.5">¿Tenés preguntas? Te respondo.</h3>
            </div>

            <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
              {faqList.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-xs">
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-bold text-xs sm:text-sm md:text-base text-black flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>

        </main>
      </div>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-slate-300 hover:text-white p-2.5 transition-all hover:scale-110 cursor-pointer flex items-center justify-center drop-shadow-md"
          title="Volver arriba"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <footer className="mt-auto py-10 px-4 sm:px-6 md:px-12 bg-slate-50 border-t border-slate-200 text-slate-600 text-xs w-full">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col gap-1.5">
            <h4 className="titulo-card text-black">Paseando por ETS 2</h4>
            <p className="text-slate-500 leading-relaxed text-[11px] sm:text-xs">Plataforma oficial de rutas argentinas, simulación y comunidad de larga distancia.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h4 className="titulo-card text-black">Desarrollo y Branding</h4>
            <p className="text-slate-500 text-[11px] sm:text-xs">Diseñado y desarrollado por <a href="https://ndiweb.com" target="_blank" rel="noopener noreferrer" className="text-black font-bold underline hover:text-[#75AADB] inline-flex items-center gap-1">NDI | Diseño & Web <ExternalLink className="w-3 h-3" /></a>.</p>
            <a href="https://ndiweb.com" target="_blank" rel="noopener noreferrer" className="text-[#75AADB] font-semibold hover:underline">www.ndiweb.com</a>
          </div>

          <div className="flex flex-col gap-1.5">
            <h4 className="titulo-card text-black">Marco Legal</h4>
            <a href="/paseandoporets2/terminos.html" className="text-slate-500 hover:text-black transition-colors text-[11px] sm:text-xs">Términos y Condiciones</a>
            <a href="/paseandoporets2/privacidad.html" className="text-slate-500 hover:text-black transition-colors text-[11px] sm:text-xs">Política de Privacidad</a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto pt-4 border-t border-slate-200 text-center flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 text-[10px] sm:text-xs">
          <p>© 2026 Paseando por ETS 2 — Todos los derechos reservados.</p>
          <p>Ledesma, Jujuy, Argentina</p>
        </div>
    </footer>

    <CookieBanner />
  </div>
);
}