// The analyzeTarpitLogs flow analyzes tarpit logs using AI to identify unusual or suspicious crawler activity patterns.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTarpitLogsInputSchema = z.object({
  logs: z.string().describe('The tarpit logs to analyze.'),
});
export type AnalyzeTarpitLogsInput = z.infer<typeof AnalyzeTarpitLogsInputSchema>;

const AnalyzeTarpitLogsOutputSchema = z.object({
  summary: z.string().describe('A summary of the analysis of the tarpit logs.'),
  anomalies: z.array(z.string()).describe('A list of any anomalies detected in the logs.'),
});
export type AnalyzeTarpitLogsOutput = z.infer<typeof AnalyzeTarpitLogsOutputSchema>;

export async function analyzeTarpitLogs(input: AnalyzeTarpitLogsInput): Promise<AnalyzeTarpitLogsOutput> {
  return analyzeTarpitLogsFlow(input);
}

const analyzeTarpitLogsPrompt = ai.definePrompt({
  name: 'analyzeTarpitLogsPrompt',
  input: {schema: AnalyzeTarpitLogsInputSchema},
  output: {schema: AnalyzeTarpitLogsOutputSchema},
  prompt: `You are an AI expert in analyzing tarpit logs for unusual or suspicious crawler activity.

  Analyze the following tarpit logs and provide a summary of the analysis, including any anomalies detected.

  Logs:
  {{logs}}
  `,
});

const analyzeTarpitLogsFlow = ai.defineFlow(
  {
    name: 'analyzeTarpitLogsFlow',
    inputSchema: AnalyzeTarpitLogsInputSchema,
    outputSchema: AnalyzeTarpitLogsOutputSchema,
  },
  async input => {
    const {output} = await analyzeTarpitLogsPrompt(input);
    return output!;
  }
);
