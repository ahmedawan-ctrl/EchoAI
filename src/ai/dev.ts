import { config } from 'dotenv';
config();

import '@/ai/flows/detect-ultrasound-anomalies.ts';
import '@/ai/flows/answer-questions-about-ultrasound.ts';
import '@/ai/flows/generate-preliminary-report.ts';