'use server';
/**
 * @fileOverview An AI flow for extracting information from medicine labels using OCR.
 *
 * - extractLabel - A function that handles the medicine label extraction process.
 * - ExtractLabelInput - The input type for the extractLabel function.
 * - ExtractLabelOutput - The return type for the extractLabel function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractLabelInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a medicine label, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractLabelInput = z.infer<typeof ExtractLabelInputSchema>;

const ExtractLabelOutputSchema = z.object({
  id: z.string().optional().describe('The alphanumeric code of the medicine (e.g., A1109). This is usually the first and most prominent code on the label.'),
  name: z.string().optional().describe('The name of the medicine product (e.g., Multivitaminas). This is typically the line after the ID.'),
  presentation: z.string().optional().describe('The presentation of the medicine. Look for keywords like "Comprimido", "Inyectable", "Suspensión", "Jarabe", etc. (e.g., Comprimido). This is often the last line.'),
});
export type ExtractLabelOutput = z.infer<typeof ExtractLabelOutputSchema>;

export async function extractLabel(input: ExtractLabelInput): Promise<ExtractLabelOutput> {
  return extractLabelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractLabelPrompt',
  input: { schema: ExtractLabelInputSchema },
  output: { schema: ExtractLabelOutputSchema },
  prompt: `You are an expert pharmacy assistant specialized in digitizing information from medicine labels. Your task is to analyze the provided image of a shelf label and extract the key information into a structured JSON format.

The label will contain the medicine's ID, name, and presentation. Follow these rules for extraction:
1.  **ID**: This is the primary code, usually alphanumeric and located at the top of the label. In the example provided, it is 'A1109'.
2.  **Name**: This is the main name of the medicine, typically found directly below the ID. In the example, it is 'Multivitaminas'.
3.  **Presentation**: This describes the form of the medicine. It's often on the last line and could be words like 'Comprimido', 'Inyectable', 'Suspensión', 'Jarabe', etc. In the example, it is 'Comprimido'. Ignore any other descriptive text like 'Según concentración estándar'.

Return ONLY the JSON object that conforms to the output schema. Do not include any other text, explanations, or markdown formatting.

Image of the label:
{{media url=photoDataUri}}`,
});

const extractLabelFlow = ai.defineFlow(
  {
    name: 'extractLabelFlow',
    inputSchema: ExtractLabelInputSchema,
    outputSchema: ExtractLabelOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return any output. The label might be unreadable.');
    }
    return output;
  }
);
