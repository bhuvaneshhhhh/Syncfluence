import { config } from 'dotenv';
config();

import '@/ai/flows/extract-tasks-from-messages.ts';
import '@/ai/flows/summarize-chat-history.ts';