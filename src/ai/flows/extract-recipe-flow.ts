
'use server';
/**
 * @fileOverview An AI flow for extracting information from medical prescriptions using OCR.
 *
 * - extractRecipe - A function that handles the prescription extraction process.
 * - ExtractRecipeInput - The input type for the extractRecipe function.
 * - ExtractRecipeOutput - The return type for the extractRecipe function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractRecipeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a medical prescription, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRecipeInput = z.infer<typeof ExtractRecipeInputSchema>;

const MedicineItemSchema = z.object({
  code: z.string().optional().describe('The code of the medicine, if present (e.g., C0902).'),
  product: z.string().describe('The name of the medicine product. Interpret handwriting to find the most likely standardized medicine name (e.g., "Traumina" should be "Tramadol").'),
  quantity: z.number().describe('The quantity of the medicine to be dispensed.'),
});

const ExtractRecipeOutputSchema = z.object({
  prescriptionNumber: z.string().optional().describe("The main number of the prescription (often labeled 'RECETARIO' or similar)."),
  patientName: z.string().optional().describe("The full name of the patient."),
  patientId: z.string().optional().describe("The patient's ID number or 'matrícula'."),
  date: z.string().optional().describe("The date of the prescription, formatted as YYYY-MM-DD if possible."),
  medicines: z.array(MedicineItemSchema).describe('A list of all medicines extracted from the prescription.'),
});
export type ExtractRecipeOutput = z.infer<typeof ExtractRecipeOutputSchema>;


export async function extractRecipe(input: ExtractRecipeInput): Promise<ExtractRecipeOutput> {
  return extractRecipeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'extractRecipePrompt',
  input: { schema: ExtractRecipeInputSchema },
  output: { schema: ExtractRecipeOutputSchema },
  prompt: `You are a highly skilled pharmacy assistant specialized in digitizing medical prescriptions. Your task is to analyze the provided image of a prescription and extract the key information into a structured JSON format.

The prescription may be handwritten, printed, or a mix of both. Pay close attention to details and do your best to interpret handwriting. If a value is not clearly present, omit it from the result.

Please extract the following information:
- The main prescription number (often a prominent number near the top, like the one in red ink labeled 'RECETARIO').
- The patient's full name (NOMBRE Y APELLIDOS).
- The patient's identification number (MATRÍCULA).
- The date of the prescription (FECHA). Convert it to YYYY-MM-DD format if possible.
- A list of all medicines. For each medicine, extract:
  - Its code (CÓDIGO).
  - The product name (PRODUCTO). If handwritten, provide the most likely standardized medicine name (e.g., 'Traumina' or 'Tramivil' should be interpreted as 'Tramadol', 'Quimotrip' could be 'Quetiapina').
  - The quantity (CANTIDAD).

Return ONLY the JSON object that conforms to the output schema. Do not include any other text, explanations, or markdown formatting.

Image of the prescription:
{{media url=photoDataUri}}`,
});


const extractRecipeFlow = ai.defineFlow(
  {
    name: 'extractRecipeFlow',
    inputSchema: ExtractRecipeInputSchema,
    outputSchema: ExtractRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return any output. The prescription might be unreadable.');
    }
    return output;
  }
);
