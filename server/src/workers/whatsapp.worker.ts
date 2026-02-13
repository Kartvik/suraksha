import { Worker, Job } from 'bullmq';
import { getRedis, getRedisOptions } from '../config/redis.js';
import twilio from 'twilio';

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials: TWILIO_ACCOUNT_SID and/or TWILIO_AUTH_TOKEN');
  }

  return twilio(accountSid, authToken);
};

// Format phone to E.164 format (required for WhatsApp)
const formatPhoneE164 = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already has country code (11+ digits)
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }
  
  // Assume India (+91) if no country code
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // Return as-is with + prefix
  return `+${cleaned}`;
};

const sendSmsFallback = async (to: string, message: string) => {
  const formattedTo = formatPhoneE164(to);
  const smsFrom = process.env.TWILIO_SMS_FROM || process.env.TWILIO_WHATSAPP_FROM;

  if (!smsFrom) {
    throw new Error('Missing TWILIO_SMS_FROM or TWILIO_WHATSAPP_FROM for SMS fallback');
  }

  console.log(`Sending SMS fallback to ${formattedTo}...`);
  const result = await getTwilioClient().messages.create({
    from: smsFrom,
    to: formattedTo,
    body: message,
  });
  console.log('Twilio SMS fallback sent', { sid: result.sid, to: formattedTo });
  return result;
};

const sendWhatsApp = async (to: string, message: string) => {
  const formattedTo = formatPhoneE164(to);
  console.log(`Sending WhatsApp to ${formattedTo}...`);

  try {
    const result = await getTwilioClient().messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${formattedTo}`,
      body: message,
    });
    console.log('Twilio message sent', { sid: result.sid, to: `whatsapp:${formattedTo}` });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown Twilio error');
    console.error('Twilio API Error Details:', {
      status: typeof error === 'object' && error !== null && 'status' in error ? (error as any).status : undefined,
      code: typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : undefined,
      message: err.message,
      details: typeof error === 'object' && error !== null && 'details' in error ? (error as any).details : undefined,
      fullError: error,
    });

    const fallbackMessage = `Your Women Safety Platform OTP is: ${message.match(/\*?(\d{6})\*?/)?.[1] || message}`;
    try {
      await sendSmsFallback(to, fallbackMessage);
      console.warn('WhatsApp failed, SMS fallback sent');
      return;
    } catch (smsError: unknown) {
      const smsErr = smsError instanceof Error ? smsError : new Error('Unknown SMS fallback error');
      console.error('SMS fallback failed:', smsErr.message);
      throw err;
    }
  }
};

let whatsappWorker: Worker | null = null;

export const startWhatsAppWorker = () => {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not available — WhatsApp worker not started');
    return;
  }

  console.log('Worker env:', {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN ? 'loaded' : 'missing',
    from: process.env.TWILIO_WHATSAPP_FROM,
  });

  whatsappWorker = new Worker(
    'whatsappQueue',
    async (job: Job) => {
      if (job.name === 'send-otp') {
        const { phone, name, otp } = job.data;
        await sendWhatsApp(
          phone,
          `Hello ${name},\n\nYour Women Safety Platform verification OTP is: *${otp}*\n\nThis OTP expires in 10 minutes.\n\nDo not share this with anyone.`
        );
        console.log(`WhatsApp OTP sent to ${formatPhoneE164(phone)}`);
      }

      if (job.name === 'send-sos') {
        const { phone, name, sosId, location, userName } = job.data;
        const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        await sendWhatsApp(
          phone,
          `🚨 *SOS ALERT* 🚨\n\nOfficer ${name},\n\nA woman needs immediate help!\n\n*SOS ID:* ${sosId}\n*User:* ${userName}\n*Location:* ${mapsLink}\n\nPlease respond immediately.`
        );
        console.log(`WhatsApp SOS sent to ${formatPhoneE164(phone)}`);
      }
    },
    { connection: getRedisOptions() }
  );

  whatsappWorker.on('active', (job) =>
    console.log(`WhatsApp job ${job.id} is active: ${job.name}`)
  );
  whatsappWorker.on('completed', (job) => console.log(`WhatsApp job ${job.id} done`));
  whatsappWorker.on('failed', (job, err) => {
    console.error(`WhatsApp job ${job?.id} failed: ${err.message}`);
    console.error('Job data:', job?.data);
    console.error('Full error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...('code' in err ? { code: (err as any).code } : {}),
      ...('status' in err ? { status: (err as any).status } : {}),
      ...('details' in err ? { details: (err as any).details } : {}),
    });
  });
  whatsappWorker.on('error', (err) =>
    console.error('WhatsApp worker error:', err?.message || err)
  );

  console.log('WhatsApp worker started');
};