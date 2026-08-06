import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

const base64 =
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!base64) {
  throw new Error(
    "Falta FIREBASE_SERVICE_ACCOUNT_BASE64."
  );
}

const serviceAccount = JSON.parse(
  Buffer.from(base64, "base64").toString(
    "utf8"
  )
) as ServiceAccount;

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId:
            serviceAccount.project_id,
          clientEmail:
            serviceAccount.client_email,
          privateKey:
            serviceAccount.private_key,
        }),
        storageBucket:
          process.env
            .FIREBASE_STORAGE_BUCKET,
      });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage =
  getStorage(app);