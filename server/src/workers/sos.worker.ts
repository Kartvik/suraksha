import { Worker, Job } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { Officer, OfficerStatus, User, PoliceStation } from '../models/index.js';
import { addWhatsAppSOSJob } from '../queues/whatsapp.queue.js';
import nodemailer from 'nodemailer';

const sendSOSEmail = async (
  to: string,
  officerName: string,
  sosId: string,
  userName: string,
  mapsLink: string
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Women Safety Platform" <${process.env.EMAIL_FROM}>`,
    to,
    subject: '🚨 SOS ALERT — Immediate Response Required',
    html: `
      <h2>🚨 SOS Alert</h2>
      <p>Dear Officer ${officerName},</p>
      <p>A woman needs immediate help!</p>
      <p><strong>SOS ID:</strong> ${sosId}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Location:</strong> <a href="${mapsLink}">Open in Google Maps</a></p>
      <p>Please respond immediately.</p>
    `,
  });
};

export const startSOSWorker = () => {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not available — SOS worker not started');
    return;
  }

  const worker = new Worker(
    'sosQueue',
    async (job: Job) => {
      if (job.name === 'process-sos') {
        const { sosId, userName, latitude, longitude, nearbyStationIds } = job.data;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

        // Get all active, verified, on-duty officers from nearby stations
        const officers = await Officer.find({
          stationId: { $in: nearbyStationIds },
          status: OfficerStatus.ACTIVE,
          isVerified: true,
          isOnDuty: true,
        }).populate('userId', 'name email phone');

        console.log(`SOS ${sosId} — notifying ${officers.length} officers`);

        for (const officer of officers) {
          const user = officer.userId as any;
          if (!user) continue;

          // WhatsApp notification
          await addWhatsAppSOSJob({
            officerId: officer._id.toString(),
            phone: user.phone,
            name: user.name,
            sosId,
            location: { latitude, longitude },
            userName,
          });

          // Email notification
          try {
            await sendSOSEmail(
              user.email,
              user.name,
              sosId,
              userName,
              mapsLink
            );
          } catch (err: any) {
            console.error(`Email failed for officer ${user.name}:`, err.message);
          }
        }
      }
    },
    { connection: redis }
  );

  worker.on('completed', (job) => console.log(`SOS job ${job.id} done`));
  worker.on('failed', (job, err) =>
    console.error(`SOS job ${job?.id} failed:`, err.message)
  );

  console.log('SOS worker started');
};                  