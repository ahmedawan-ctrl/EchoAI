'use server';
/**
 * @fileOverview A flow to answer questions about an ultrasound image.
 *
 * - answerQuestionsAboutUltrasound - A function that takes an ultrasound image and a question, and returns an answer.
 * - AnswerQuestionsAboutUltrasoundInput - The input type for the answerQuestionsAboutUltrasound function.
 * - AnswerQuestionsAboutUltrasoundOutput - The return type for the answerQuestionsAboutUltrasound function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsAboutUltrasoundInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an ultrasound, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question about the ultrasound image.'),
});
export type AnswerQuestionsAboutUltrasoundInput = z.infer<typeof AnswerQuestionsAboutUltrasoundInputSchema>;

const AnswerQuestionsAboutUltrasoundOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the ultrasound image.'),
});
export type AnswerQuestionsAboutUltrasoundOutput = z.infer<typeof AnswerQuestionsAboutUltrasoundOutputSchema>;

export async function answerQuestionsAboutUltrasound(input: AnswerQuestionsAboutUltrasoundInput): Promise<AnswerQuestionsAboutUltrasoundOutput> {
  return answerQuestionsAboutUltrasoundFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsAboutUltrasoundPrompt',
  input: {schema: AnswerQuestionsAboutUltrasoundInputSchema},
  output: {schema: AnswerQuestionsAboutUltrasoundOutputSchema},
  prompt: `You are an expert in interpreting ultrasound images. Please answer the following question about the ultrasound image.

Question: {{{question}}}

Ultrasound Image: {{media url=photoDataUri}}

Answer:`,
});

const answerQuestionsAboutUltrasoundFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutUltrasoundFlow',
    inputSchema: AnswerQuestionsAboutUltrasoundInputSchema,
    outputSchema: AnswerQuestionsAboutUltrasoundOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
