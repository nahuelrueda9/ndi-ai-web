"use client";

import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { REGIONES } from "./argentina-mapa";
import { COORDENADAS } from "./ciudades-geo";

type CiudadCeibo = {
  n: string;
  zona: string;
  x: number;
  y: number;
  empresas?: string[];
};

type Props = {
  ciudades: CiudadCeibo[];
  origen: string;
  destino: string;
  modoSeleccionMapa: "origen" | "destino";
  onSelectCity: (nombre: string) => void;
};

// ---------------------------------------------------------------------------
// Proyección: latitud / longitud reales -> plano del mapa (1 unidad = 2 grados)
// ---------------------------------------------------------------------------
const LON0 = -62.5;
const LAT0 = -32;
const COS_LAT = Math.cos(THREE.MathUtils.degToRad(32));
const ESCALA = 0.5;
const ALTO = 0.16; // grosor del mapa 3D

const proyectar = (lat: number, lon: number) =>
  new THREE.Vector2((lon - LON0) * COS_LAT * ESCALA, (lat - LAT0) * ESCALA);

const COLOR_ORIGEN = "#0ea5e9";
const COLOR_DESTINO = "#ef4444";
const COLOR_PUNTO = "#1e3a5f";
const K_PUNTO = 0.0048;

const PRINCIPALES = [
  "San Salvador de Jujuy",
  "Salta Capital",
  "San Miguel de Tucumán",
  "Posadas",
  "Córdoba",
  "Rosario",
  "Buenos Aires",
  "Mar del Plata",
  "Bahía Blanca",
  "San Carlos de Bariloche",
  "Viedma",
];

const VISTA_DIR = new THREE.Vector3(0, 9.5, 8.2).normalize();

const VISTAS_PROVINCIAS: Record<string, { lat: number; lon: number; dist: number }> = {
  "Gran Buenos Aires": { lat: -34.62, lon: -58.5, dist: 1.8 },
  "Buenos Aires": { lat: -37.0, lon: -60.0, dist: 3.5 },
  "Córdoba": { lat: -31.41, lon: -64.18, dist: 2.2 },
  "Santa Fe": { lat: -30.5, lon: -60.7, dist: 2.5 },
  "Entre Ríos": { lat: -32.48, lon: -58.23, dist: 2.2 },
  "Corrientes": { lat: -28.5, lon: -57.5, dist: 2.5 },
  "Misiones": { lat: -26.8, lon: -54.5, dist: 2.2 },
  "Mendoza": { lat: -32.89, lon: -68.82, dist: 2.2 },
  "San Luis": { lat: -33.3, lon: -66.3, dist: 2.2 },
  "La Pampa": { lat: -36.6, lon: -64.3, dist: 2.8 },
  "Neuquén": { lat: -39.0, lon: -69.5, dist: 2.8 },
  "Río Negro": { lat: -40.81, lon: -65.0, dist: 3.2 },
  "Chubut": { lat: -43.0, lon: -65.1, dist: 3.0 },
  "Tucumán": { lat: -26.81, lon: -65.21, dist: 1.6 },
  "Santiago del Estero": { lat: -27.8, lon: -63.2, dist: 2.6 },
  "Salta": { lat: -24.80, lon: -65.42, dist: 2.5 },
  "Jujuy": { lat: -23.5, lon: -65.4, dist: 2.0 },
  "Catamarca": { lat: -28.47, lon: -65.78, dist: 2.5 },
  "La Rioja": { lat: -29.41, lon: -66.85, dist: 2.5 },
};

function anillo(plano: number[]) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < plano.length; i += 2) pts.push(proyectar(plano[i + 1], plano[i]));
  return pts;
}

function Territorio() {
  const { regiones, matAR, matUY } = useMemo(() => {
    const regiones = REGIONES.map((r) => {
      const shapes = r.p.map((poligono) => {
        const [exterior, ...huecos] = poligono;
        const shape = new THREE.Shape(anillo(exterior));
        huecos.forEach((h) => shape.holes.push(new THREE.Path(anillo(h))));
        return shape;
      });
      const geo = new THREE.ExtrudeGeometry(shapes, { depth: ALTO, bevelEnabled: false });
      const bordes = r.p.flatMap((poligono) =>
        poligono.map((ring) =>
          new THREE.BufferGeometry().setFromPoints(
            anillo(ring).map((v) => new THREE.Vector3(v.x, v.y, ALTO + 0.004)),
          ),
        ),
      );
      return { n: r.n, pais: r.pais, geo, bordes };
    });
    const lado = new THREE.MeshLambertMaterial({ color: "#8fb3d6" });
    return {
      regiones,
      matAR: [new THREE.MeshBasicMaterial({ color: "#d7e7f6" }), lado],
      matUY: [new THREE.MeshBasicMaterial({ color: "#e6edf5" }), lado],
    };
  }, []);

  return (
    <group>
      {regiones.map((r) => (
        <group key={r.n + r.pais}>
          <mesh geometry={r.geo} material={r.pais === "UY" ? matUY : matAR} />
          {r.bordes.map((b, i) => (
            <lineLoop key={i} geometry={b}>
              <lineBasicMaterial color="#9dbbd8" />
            </lineLoop>
          ))}
        </group>
      ))}
    </group>
  );
}

type ControlesLike = {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (tipo: string, fn: () => void) => void;
  removeEventListener: (tipo: string, fn: () => void) => void;
};

export type ApiCamara = {
  zoom: (factor: number) => void;
  reset: () => void;
  ir: (lat: number, lon: number, distancia: number) => void;
};

function useControles() {
  return useThree((s) => s.controls) as unknown as ControlesLike | null;
}

function Camara({ apiRef }: { apiRef: React.MutableRefObject<ApiCamara | null> }) {
  const { camera, size } = useThree();
  const controls = useControles();
  const inicial = useRef({ pos: new THREE.Vector3(0, 9.5, 8.2), target: new THREE.Vector3() });
  const objetivo = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (!controls) return;
    const cam = camera as THREE.PerspectiveCamera;
    const alto = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const ancho = alto * (size.width / Math.max(size.height, 1));
    const dist = Math.max(8.8 / ancho, 8.6 / alto);
    inicial.current = { pos: VISTA_DIR.clone().multiplyScalar(dist), target: new THREE.Vector3(0, 0, 0) };
    camera.position.copy(inicial.current.pos);
    controls.target.copy(inicial.current.target);
    controls.update();
  }, [controls, camera, size.width, size.height]);

  useEffect(() => {
    if (!controls) return;
    const limitar = () => {
      const t = controls.target;
      const x = THREE.MathUtils.clamp(t.x, -4.2, 4.2);
      const z = THREE.MathUtils.clamp(t.z, -5.2, 5.2);
      if (x !== t.x || z !== t.z) {
        camera.position.x += x - t.x;
        camera.position.z += z - t.z;
        t.x = x;
        t.z = z;
      }
    };
    controls.addEventListener("change", limitar);
    return () => controls.removeEventListener("change", limitar);
  }, [controls, camera]);

  useFrame(() => {
    const o = objetivo.current;
    if (!o || !controls) return;
    camera.position.lerp(o.pos, 0.14);
    controls.target.lerp(o.target, 0.14);
    controls.update();
    if (camera.position.distanceTo(o.pos) < 0.01 && controls.target.distanceTo(o.target) < 0.01) {
      objetivo.current = null;
    }
  });

  useEffect(() => {
    if (!controls) return;
    apiRef.current = {
      zoom: (factor) => {
        const dir = camera.position.clone().sub(controls.target);
        const nueva = THREE.MathUtils.clamp(dir.length() / factor, 1.8, 22);
        objetivo.current = { pos: controls.target.clone().add(dir.setLength(nueva)), target: controls.target.clone() };
      },
      reset: () => {
        objetivo.current = { pos: inicial.current.pos.clone(), target: inicial.current.target.clone() };
      },
      ir: (lat, lon, distancia) => {
        const p = proyectar(lat, lon);
        const target = new THREE.Vector3(p.x, ALTO, -p.y);
        objetivo.current = { pos: target.clone().add(VISTA_DIR.clone().multiplyScalar(distancia)), target };
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [controls, camera, apiRef]);

  return null;
}

function Halo({ x, y, color }: { x: number; y: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const controls = useControles();
  useFrame(({ camera, clock }) => {
    const m = ref.current;
    if (!m) return;
    const d = controls ? camera.position.distanceTo(controls.target) : camera.position.length();
    const t = (clock.getElapsedTime() % 1.6) / 1.6;
    m.scale.setScalar(d * K_PUNTO * (2.2 + t * 3.2));
    (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[x, y, ALTO + 0.01]}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function Ciudades({ ciudades, origen, destino, modoSeleccionMapa, onSelectCity }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const controls = useControles();

  const lista = useMemo(() => {
    return ciudades.flatMap((c) => {
      const g = COORDENADAS[c.n];
      if (!g) return [];
      const p = proyectar(g[0], g[1]);
      return [{ n: c.n, x: p.x, y: p.y }];
    });
  }, [ciudades]);

  useFrame(({ camera }) => {
    const d = controls ? camera.position.distanceTo(controls.target) : camera.position.length();
    const s = d * K_PUNTO;
    for (const g of refs.current) if (g) g.scale.setScalar(s);
  });

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const colorModo = modoSeleccionMapa === "origen" ? COLOR_ORIGEN : COLOR_DESTINO;
  const seleccionadas = lista.filter((c) => c.n === origen || c.n === destino);

  return (
    <group>
      {lista.map((c, i) => {
        const tipo = c.n === origen ? "origen" : c.n === destino ? "destino" : null;
        const esHover = hover === c.n;
        const factor = tipo ? 1.9 : esHover ? 1.6 : 1;
        const color = tipo === "origen" ? COLOR_ORIGEN : tipo === "destino" ? COLOR_DESTINO : esHover ? colorModo : COLOR_PUNTO;
        return (
          <group
            key={c.n}
            ref={(g) => {
              refs.current[i] = g;
            }}
            position={[c.x, c.y, ALTO]}
          >
            <group scale={factor}>
              <mesh
                position={[0, 0, 1]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCity(c.n);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHover(c.n);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  setHover((h) => (h === c.n ? null : h));
                  document.body.style.cursor = "auto";
                }}
              >
                <sphereGeometry args={[2.3, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0, 1]} scale={1.4}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshBasicMaterial color="#ffffff" side={THREE.BackSide} />
              </mesh>
              <mesh position={[0, 0, 1]}>
                <sphereGeometry args={[1, 14, 14]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {(esHover || tipo) && (
                <Html center position={[0, 0, 3.8]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                  <div
                    className="whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold text-white shadow-lg"
                    style={{ background: tipo === "destino" ? COLOR_DESTINO : tipo === "origen" ? COLOR_ORIGEN : esHover ? colorModo : COLOR_PUNTO }}
                  >
                    {tipo === "origen" ? "Origen · " : tipo === "destino" ? "Destino · " : ""}
                    {c.n}
                  </div>
                </Html>
              )}
            </group>
          </group>
        );
      })}

      {seleccionadas.map((c) => (
        <Halo key={"halo" + c.n} x={c.x} y={c.y} color={c.n === origen ? COLOR_ORIGEN : COLOR_DESTINO} />
      ))}

      {PRINCIPALES.map((nombre) => {
        const c = lista.find((l) => l.n === nombre);
        if (!c || c.n === origen || c.n === destino || c.n === hover) return null;
        return (
          <Html key={"rot" + nombre} center position={[c.x, c.y, ALTO + 0.1]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
            <div
              className="-translate-y-4 whitespace-nowrap text-[10px] font-semibold text-slate-600 select-none"
              style={{ textShadow: "0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff" }}
            >
              {nombre === "Salta Capital" ? "Salta" : nombre === "San Carlos de Bariloche" ? "Bariloche" : nombre === "San Salvador de Jujuy" ? "Jujuy" : nombre === "San Miguel de Tucumán" ? "Tucumán" : nombre}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function Ruta({ origen, destino }: { origen: string; destino: string }) {
  const puntos = useMemo(() => {
    const a = COORDENADAS[origen];
    const b = COORDENADAS[destino];
    if (!a || !b) return null;
    const pa = proyectar(a[0], a[1]);
    const pb = proyectar(b[0], b[1]);
    const base = ALTO + 0.06;
    const start = new THREE.Vector3(pa.x, pa.y, base);
    const end = new THREE.Vector3(pb.x, pb.y, base);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.z = base + Math.min(2.4, pa.distanceTo(pb) * 0.55);
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(64);
  }, [origen, destino]);

  if (!puntos) return null;
  return <Line points={puntos} color={COLOR_ORIGEN} lineWidth={3} />;
}

function Escena({ apiRef, ...props }: Props & { apiRef: React.MutableRefObject<ApiCamara | null> }) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[-4, 9, 6]} intensity={1.4} />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Territorio />
        <Ciudades {...props} />
        <Ruta origen={props.origen} destino={props.destino} />
      </group>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={1.8}
        maxDistance={22}
        minPolarAngle={0.15}
        maxPolarAngle={1.25}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        screenSpacePanning={false}
      />
      <Camara apiRef={apiRef} />
    </>
  );
}

const GloboCeibo = forwardRef<ApiCamara, Props>((props, ref) => {
  const apiRef = useRef<ApiCamara | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esOrigen = props.modoSeleccionMapa === "origen";

  useImperativeHandle(ref, () => ({
    zoom: (factor: number) => apiRef.current?.zoom(factor),
    reset: () => apiRef.current?.reset(),
    ir: (lat: number, lon: number, distancia: number) => apiRef.current?.ir(lat, lon, distancia),
  }));

  const boton =
    "pointer-events-auto flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-3 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white cursor-pointer";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-gradient-to-b from-sky-50 to-white">
      <Canvas camera={{ position: [0, 9.5, 8.2], fov: 35, near: 0.1, far: 80 }} dpr={[1, 2]}>
        <Escena {...props} apiRef={apiRef} />
      </Canvas>

      {/* Contenedor Superior Único: Sin duplicaciones y texto en minúscula ("origen" / "destino") */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-30 pointer-events-none">
        
        {/* Cartel Izquierda */}
        <div
          className="pointer-events-auto rounded-full px-3.5 py-2 text-[10px] sm:text-[11px] font-bold text-white shadow-md flex-shrink truncate"
          style={{ background: esOrigen ? COLOR_ORIGEN : COLOR_DESTINO }}
        >
          toca o escribí tu {esOrigen ? "origen" : "destino"}
        </div>

        {/* Controles Derecha (Zoom y Provincias) */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto flex-shrink-0">
          <div className="flex items-center gap-1">
            <button type="button" className={boton} onClick={() => apiRef.current?.zoom(1.5)} aria-label="Acercar">+</button>
            <button type="button" className={boton} onClick={() => apiRef.current?.zoom(1 / 1.5)} aria-label="Alejar">−</button>
          </div>

          {/* Botón desplegable de Provincias */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-xs font-black text-slate-800 shadow-md transition hover:bg-slate-50 cursor-pointer"
            >
              🗺️ Provincias ▾
            </button>

            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 flex flex-col gap-1">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  onClick={() => {
                    apiRef.current?.reset();
                    setMenuAbierto(false);
                  }}
                >
                  🌍 Todo el mapa
                </button>
                <div className="h-[1px] w-full bg-slate-100 my-1"></div>
                {Object.entries(VISTAS_PROVINCIAS).map(([nombreProvincia, datos]) => (
                  <button
                    key={nombreProvincia}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    onClick={() => {
                      apiRef.current?.ir(datos.lat, datos.lon, datos.dist);
                      setMenuAbierto(false);
                    }}
                  >
                    {nombreProvincia}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Tarjeta flotante inferior: Oculta en celular (hidden), visible solo en PC (md:block) */}
      <div className="pointer-events-none absolute bottom-4 left-4 hidden md:block rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur-md">
        <div className="mb-1 font-bold uppercase tracking-wider text-slate-800">Seleccioná una ciudad</div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLOR_ORIGEN }} />Origen</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLOR_DESTINO }} />Destino</span>
          <span className="text-slate-500">Arrastrá para mover · rueda o + / − para zoom</span>
        </div>
      </div>
    </div>
  );
});

GloboCeibo.displayName = "GloboCeibo";

export default GloboCeibo;