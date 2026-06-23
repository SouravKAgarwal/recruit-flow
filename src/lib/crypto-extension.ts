import { encryptData, decryptData } from "./crypto";

const ENCRYPTED_MODELS: Record<string, string[]> = {
  SmtpAccount: ["host", "username", "encryptedPassword", "email"],
  Recruiter: ["name", "company", "role", "email", "linkedin", "location"],
  Resume: ["originalName"],
  Campaign: ["name"],
  EmailLog: ["toEmail", "subject", "errorMessage"],
  EmailTemplate: ["subject", "body"],
};

const RELATION_MODELS: Record<string, string> = {
  smtpAccount: "SmtpAccount",
  smtpAccounts: "SmtpAccount",
  recruiter: "Recruiter",
  recruiters: "Recruiter",
  resume: "Resume",
  resumes: "Resume",
  campaign: "Campaign",
  campaigns: "Campaign",
  emailLog: "EmailLog",
  emailLogs: "EmailLog",
  emailTemplate: "EmailTemplate",
  templates: "EmailTemplate",
  template: "EmailTemplate",
  user: "User",
};

export const encryptionExtension = {
  name: "field-encryption",
  query: {
    $allModels: {
      async $allOperations({ model, args, query }: any) {
        const fieldsToEncrypt = ENCRYPTED_MODELS[model];

        // 1. Encrypt args.data if applicable
        if (fieldsToEncrypt && args.data) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item: unknown) =>
              encryptObject(item as Record<string, unknown>, fieldsToEncrypt),
            );
          } else {
            args.data = encryptObject(args.data as Record<string, unknown>, fieldsToEncrypt);
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

function deepDecrypt(obj: unknown, modelName: string): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj))
    return obj.map((item) => deepDecrypt(item, modelName));

  let newObj = { ...(obj as Record<string, unknown>) };
  const fields = ENCRYPTED_MODELS[modelName];
  if (fields) {
    newObj = decryptObject(newObj, fields) as Record<string, unknown>;
  }

  for (const [key, val] of Object.entries(newObj)) {
    if (val && typeof val === "object" && RELATION_MODELS[key]) {
      newObj[key] = deepDecrypt(val, RELATION_MODELS[key]);
    }
  }

  return newObj;
}

function encryptObject(obj: unknown, fields: string[]): unknown {
  if (!obj || typeof obj !== "object") return obj;
  const newObj = { ...(obj as Record<string, unknown>) };
  for (const field of fields) {
    if (newObj[field] !== undefined && newObj[field] !== null) {
      newObj[field] = encryptData(newObj[field] as string);
    }
  }
  return newObj;
}

function decryptObject(obj: unknown, fields: string[]): unknown {
  if (!obj || typeof obj !== "object") return obj;
  const newObj = { ...(obj as Record<string, unknown>) };
  for (const field of fields) {
    if (newObj[field] !== undefined && newObj[field] !== null) {
      try {
        newObj[field] = decryptData(newObj[field] as string);
      } catch {
        // Fallback
      }
    }
  }
  return newObj;
}
