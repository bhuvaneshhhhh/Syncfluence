'use server';
/**
 * @fileOverview This file defines a Genkit flow to extract tasks from chat messages.
 *
 * The flow takes a list of messages as input and returns a list of extracted tasks.
 *
 * @extractTasksFromMessages - A function that extracts tasks from a list of chat messages.
 * @ExtractTasksFromMessagesInput - The input type for the extractTasksFromMessages function.
 * @ExtractTasksFromMessagesOutput - The return type for the extractTasksFromMessages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTasksFromMessagesInputSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.string().describe('The sender of the message.'),
      content: z.string().describe('The content of the message.'),
    })
  ).describe('The list of chat messages to extract tasks from.'),
});
export type ExtractTasksFromMessagesInput = z.infer<typeof ExtractTasksFromMessagesInputSchema>;

const ExtractTasksFromMessagesOutputSchema = z.array(
  z.object({
    task: z.string().describe('The extracted task.'),
    assignee: z.string().optional().describe('The person assigned to the task, if any.'),
  })
).describe('The list of extracted tasks.');
export type ExtractTasksFromMessagesOutput = z.infer<typeof ExtractTasksFromMessagesOutputSchema>;

export async function extractTasksFromMessages(input: ExtractTasksFromMessagesInput): Promise<ExtractTasksFromMessagesOutput> {
  return extractTasksFromMessagesFlow(input);
}

const extractTasksPrompt = ai.definePrompt({
  name: 'extractTasksPrompt',
  input: {schema: ExtractTasksFromMessagesInputSchema},
  output: {schema: ExtractTasksFromMessagesOutputSchema},
  prompt: `You are a helpful assistant tasked with extracting tasks from a list of chat messages.

  Analyze the following chat messages and extract any actionable tasks. For each task, identify the task itself and the person assigned to the task, if mentioned. If no assignee is explicitly mentioned, leave the assignee field blank.

  Messages:
  {{#each messages}}
  Sender: {{this.sender}}
  Content: {{this.content}}
  {{/each}}

  Tasks should be specific and actionable. Return the tasks in a JSON array.

  Make sure the output is a valid JSON array.
  `,
});

const extractTasksFromMessagesFlow = ai.defineFlow(
  {
    name: 'extractTasksFromMessagesFlow',
    inputSchema: ExtractTasksFromMessagesInputSchema,
    outputSchema: ExtractTasksFromMessagesOutputSchema,
  },
  async input => {
    const {output} = await extractTasksPrompt(input);
    return output!;
  }
);
