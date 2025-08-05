
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
    .describe('A list of potential anomalies detected in the ultrasound image. If no anomalies are found, return an empty array.'),
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
  prompt: `You are an AI expert in analyzing ultrasound images for anomalies. Your task is to analyze the provided ultrasound image and identify any potential abnormalities. You MUST return a JSON object with two properties: "anomalies" and "annotatedImage".

1.  **anomalies**: This MUST be an array of strings. Each string should describe a detected anomaly. If no anomalies are found, you MUST return an empty array, like this: \`"anomalies": []\`. **This field is mandatory and must always be present in your response.**
2.  **annotatedImage**: This MUST be a data URI string of the image with the detected anomalies highlighted.

Ultrasound Image: {{media url=photoDataUri}}
  `,
  config: {
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
