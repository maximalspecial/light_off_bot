import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

export const remindersQueue = new Queue('reminders', { connection });
export const remindersScheduler = new QueueScheduler('reminders', { connection });

export function createRemindersWorker(handler: (job: any) => Promise<void>) {
  return new Worker('reminders', async job => handler(job), { connection });
}
