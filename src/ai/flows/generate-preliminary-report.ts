'use server';

/**
 * @fileOverview Generates a preliminary report based on detected anomalies in the ultrasound image.
 *
 * - generatePreliminaryReport - A function that generates the preliminary report.
 * - GeneratePreliminaryReportInput - The input type for the generatePreliminaryReport function.
 * - GeneratePreliminaryReportOutput - The return type for the generatePreliminaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePreliminaryReportInputSchema = z.object({
  originalImageDataUri: z
    .string()
    .describe(
      "The original ultrasound image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  annotatedImageDataUri: z
    .string()
    .describe(
      "The AI-annotated ultrasound image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  detectedAnomalies: z
    .array(z.string())
    .describe('A list of detected anomalies in the ultrasound image.'),
});
export type GeneratePreliminaryReportInput = z.infer<typeof GeneratePreliminaryReportInputSchema>;

const GeneratePreliminaryReportOutputSchema = z.object({
  report: z.string().describe('The generated preliminary report.'),
});
export type GeneratePreliminaryReportOutput = z.infer<typeof GeneratePreliminaryReportOutputSchema>;

export async function generatePreliminaryReport(
  input: GeneratePreliminaryReportInput
): Promise<GeneratePreliminaryReportOutput> {
  return generatePreliminaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePreliminaryReportPrompt',
  input: {schema: GeneratePreliminaryReportInputSchema},
  output: {schema: GeneratePreliminaryReportOutputSchema},
  prompt: `You are an AI assistant specialized in generating preliminary reports for ultrasound images.

  Based on the original ultrasound image, the AI-annotated image, and the detected anomalies, generate a concise and informative preliminary report.

  Original Image: {{media url={{{originalImageDataUri}}}}}
  Annotated Image: {{media url={{{annotatedImageDataUri}}}}}
  Detected Anomalies: {{#each detectedAnomalies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Report:`,
});

const generatePreliminaryReportFlow = ai.defineFlow(
  {
    name: 'generatePreliminaryReportFlow',
    inputSchema: GeneratePreliminaryReportInputSchema,
    outputSchema: GeneratePreliminaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
