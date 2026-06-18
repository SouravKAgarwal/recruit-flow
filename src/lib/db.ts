import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const DB_FILE = path.join(process.cwd(), 'uploads', 'db.json')

export interface LogEntry {
  id: string
  jobId: string
  timestamp: string
  level: string
  message: string
}

export interface Job {
  id: string
  status: string
  total: number
  sent: number
  failed: number
  skipped: number
  currentEmail: string
  recipientsFilename: string
  resumeFilename: string
  templateText: string
  createdAt: string
  logs?: LogEntry[]
}

interface DbSchema {
  jobs: Job[]
  logs: LogEntry[]
}

async function readDb(): Promise<DbSchema> {
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
    const data = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { jobs: [], logs: [] }
  }
}

async function writeDb(data: DbSchema) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Thread-safe mutex write lock to prevent race conditions during file writing
let writeLock = false
async function lockedWrite(data: DbSchema) {
  while (writeLock) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  writeLock = true
  try {
    await writeDb(data)
  } finally {
    writeLock = false
  }
}

const dbMock = {
  job: {
    findMany: async (args?: any) => {
      const db = await readDb()
      return [...db.jobs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
    },
    
    findUnique: async (args: { where: { id: string }; include?: { logs: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ } }) => {
      const db = await readDb()
      const job = db.jobs.find(j => j.id === args.where.id)
      if (!job) return null
      
      if (args.include?.logs) {
        const logs = db.logs
          .filter(l => l.jobId === args.where.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        return { ...job, logs }
      }
      return job
    },
    
    create: async (args: {
      data: {
        status: string
        recipientsFilename: string
        resumeFilename?: string | null
        templateText: string
      }
    }) => {
      const db = await readDb()
      const newJob: Job = {
        id: crypto.randomUUID(),
        status: args.data.status,
        total: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        currentEmail: '',
        recipientsFilename: args.data.recipientsFilename,
        resumeFilename: args.data.resumeFilename || '',
        templateText: args.data.templateText,
        createdAt: new Date().toISOString()
      }
      db.jobs.push(newJob)
      await lockedWrite(db)
      return newJob
    },
    
    update: async (args: { where: { id: string }; data: Partial<Job> }) => {
      const db = await readDb()
      const idx = db.jobs.findIndex(j => j.id === args.where.id)
      if (idx === -1) return null
      
      db.jobs[idx] = { ...db.jobs[idx], ...args.data }
      await lockedWrite(db)
      return db.jobs[idx]
    }
  },
  
  log: {
    create: async (args: {
      data: {
        jobId: string
        level: string
        message: string
      }
    }) => {
      const db = await readDb()
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        jobId: args.data.jobId,
        timestamp: new Date().toISOString(),
        level: args.data.level,
        message: args.data.message
      }
      db.logs.push(newLog)
      await lockedWrite(db)
      return newLog
    }
  }
}

export const prisma = dbMock
export default dbMock
