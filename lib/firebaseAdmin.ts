import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import {
  getAuth,
  type Auth,
} from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";
import {
  getStorage,
  type Storage,
} from "firebase-admin/storage";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let adminApp: App | null = null;

function obtenerServiceAccount(): ServiceAccount {
  const base64 =
    process.env
      .FIREBASE_SERVICE_ACCOUNT_BASE64
      ?.trim();

  if (!base64) {
    throw new Error(
      "Falta FIREBASE_SERVICE_ACCOUNT_BASE64."
    );
  }

  let serviceAccount: ServiceAccount;

  try {
    serviceAccount = JSON.parse(
      Buffer.from(
        base64,
        "base64"
      ).toString("utf8")
    ) as ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 no contiene un JSON Base64 válido."
    );
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 está incompleto."
    );
  }

  return serviceAccount;
}

function obtenerAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const appExistente =
    getApps()[0];

  if (appExistente) {
    adminApp = appExistente;
    return adminApp;
  }

  /*
   * IMPORTANTE:
   * Las credenciales se leen recién cuando una API
   * usa Firebase Admin. De esta manera importar este
   * archivo durante `next build` no hace fallar el build.
   */
  const serviceAccount =
    obtenerServiceAccount();

  const storageBucket =
    process.env
      .FIREBASE_STORAGE_BUCKET
      ?.trim();

  adminApp = initializeApp({
    credential: cert({
      projectId:
        serviceAccount.project_id,
      clientEmail:
        serviceAccount.client_email,
      privateKey:
        serviceAccount.private_key,
    }),
    ...(storageBucket
      ? {
          storageBucket,
        }
      : {}),
  });

  return adminApp;
}

/*
 * Mantiene exactamente la misma API que ya usa NDI AI:
 *
 *   adminAuth.verifyIdToken(...)
 *   adminDb.collection(...)
 *   adminStorage.bucket(...)
 *
 * pero Firebase Admin se instancia recién en el primer uso real.
 */
function crearProxyDiferido<
  T extends object
>(
  obtenerInstancia: () => T
): T {
  let instancia: T | null = null;

  function obtener() {
    if (!instancia) {
      instancia =
        obtenerInstancia();
    }

    return instancia;
  }

  return new Proxy({} as T, {
    get(_target, propiedad) {
      const objeto =
        obtener();

      const valor =
        Reflect.get(
          objeto,
          propiedad,
          objeto
        );

      if (
        typeof valor === "function"
      ) {
        return valor.bind(objeto);
      }

      return valor;
    },

    set(
      _target,
      propiedad,
      valor
    ) {
      const objeto =
        obtener();

      return Reflect.set(
        objeto,
        propiedad,
        valor,
        objeto
      );
    },
  });
}

export const adminAuth =
  crearProxyDiferido<Auth>(
    () =>
      getAuth(
        obtenerAdminApp()
      )
  );

export const adminDb =
  crearProxyDiferido<Firestore>(
    () =>
      getFirestore(
        obtenerAdminApp()
      )
  );

export const adminStorage =
  crearProxyDiferido<Storage>(
    () =>
      getStorage(
        obtenerAdminApp()
      )
  );