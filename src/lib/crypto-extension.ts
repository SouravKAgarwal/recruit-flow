import { encryptData, decryptData } from "./crypto";

const ENCRYPTED_MODELS: Record<string, string[]> = {
  SmtpAccount: ["host", "username", "encryptedPassword", "email"],
  Recruiter: ["name", "company", "role", "email", "linkedin", "location"],
  Resume: ["originalName"],
  Campaign: ["name"],
};

const RELATION_MODELS: Record<string, string> = {
  smtpAccount: "SmtpAccount",
  recruiter: "Recruiter",
  resume: "Resume",
  campaign: "Campaign",
};

export const encryptionExtension = {
  name: "field-encryption",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        const fieldsToEncrypt = ENCRYPTED_MODELS[model];

        // 1. Encrypt args.data if applicable
        if (fieldsToEncrypt && args.data) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item: any) =>
              encryptObject(item, fieldsToEncrypt),
            );
          } else {
            args.data = encryptObject(args.data, fieldsToEncrypt);
          }
        }

        // 2. Execute query
        const result = await query(args);

        // 3. Deep decrypt result
        return deepDecrypt(result, model);
      },
    },
  },
};

function deepDecrypt(obj: any, modelName: string): any {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj))
    return obj.map((item) => deepDecrypt(item, modelName));

  let newObj = { ...obj };
  const fields = ENCRYPTED_MODELS[modelName];
  if (fields) {
    newObj = decryptObject(newObj, fields);
  }

  for (const [key, val] of Object.entries(newObj)) {
    if (val && typeof val === "object" && RELATION_MODELS[key]) {
      newObj[key] = deepDecrypt(val, RELATION_MODELS[key]);
    }
  }

  return newObj;
}

function encryptObject(obj: any, fields: string[]): any {
  if (!obj || typeof obj !== "object") return obj;
  const newObj = { ...obj };
  for (const field of fields) {
    if (newObj[field] !== undefined && newObj[field] !== null) {
      newObj[field] = encryptData(newObj[field]);
    }
  }
  return newObj;
}

function decryptObject(obj: any, fields: string[]): any {
  if (!obj || typeof obj !== "object") return obj;
  const newObj = { ...obj };
  for (const field of fields) {
    if (newObj[field] !== undefined && newObj[field] !== null) {
      try {
        newObj[field] = decryptData(newObj[field]);
      } catch {
        // Fallback
      }
    }
  }
  return newObj;
}
