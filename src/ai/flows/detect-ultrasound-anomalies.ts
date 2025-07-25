'use server';
/**
 * @fileOverview Detects and highlights potential abnormalities in an ultrasound image.
 *
 * - detectUltrasoundAnomalies - A function that handles the anomaly detection process.
 * - DetectUltrasoundAnomaliesInput - The input type for the detectUltrasoundAnomalies function.
 * - DetectUltrasoundAnomaliesOutput - The return type for the detectUltrasoundAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectUltrasoundAnomaliesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "An ultrasound image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectUltrasoundAnomaliesInput = z.infer<typeof DetectUltrasoundAnomaliesInputSchema>;

const DetectUltrasoundAnomaliesOutputSchema = z.object({
  anomalies: z
    .array(z.string())
    .describe('A list of potential anomalies detected in the ultrasound image.'),
  annotatedImage: z
    .string()
    .describe(
      'An annotated version of the ultrasound image with detected anomalies highlighted, as a data URI.'
    ),
});
export type DetectUltrasoundAnomaliesOutput = z.infer<typeof DetectUltrasoundAnomaliesOutputSchema>;

export async function detectUltrasoundAnomalies(
  input: DetectUltrasoundAnomaliesInput
): Promise<DetectUltrasoundAnomaliesOutput> {
  return detectUltrasoundAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectUltrasoundAnomaliesPrompt',
  input: {schema: DetectUltrasoundAnomaliesInputSchema},
  output: {schema: DetectUltrasoundAnomaliesOutputSchema},
  prompt: `You are an AI expert in analyzing ultrasound images for anomalies.

  Analyze the provided ultrasound image for any potential abnormalities. List the anomalies detected and provide an annotated version of the image highlighting these anomalies. Ensure the annotated image is returned as a data URI.

  Ultrasound Image: {{media url=photoDataUri}}
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const detectUltrasoundAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectUltrasoundAnomaliesFlow',
    inputSchema: DetectUltrasoundAnomaliesInputSchema,
    outputSchema: DetectUltrasoundAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
