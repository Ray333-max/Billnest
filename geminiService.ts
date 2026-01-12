
import { GoogleGenAI } from "@google/genai";
import { Invoice, Client } from './types';

export class BusinessAIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateInvoiceNotes(description: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a 1-sentence professional thank-you for: "${description}". Be modern, minimal, and premium.`,
      config: {
        temperature: 0.5,
      },
    });
    return response.text?.trim() || "We appreciate your partnership and look forward to our next collaboration.";
  }

  async getBusinessInsights(invoices: Invoice[], clients: Client[]): Promise<string> {
    const totalRevenue = invoices.reduce((sum, inv) => {
      const subtotal = inv.items.reduce((s, item) => s + (item.quantity * item.rate), 0);
      return sum + subtotal;
    }, 0);
    
    const overdueCount = invoices.filter(i => i.status === 'overdue').length;
    const pendingCount = invoices.filter(i => i.status === 'pending').length;

    const prompt = `
      Data Analysis:
      Total Revenue: $${totalRevenue}
      Active Client Base: ${clients.length}
      Pending Receivables: ${pendingCount}
      Overdue Accounts: ${overdueCount}
      
      Task: Act as a high-end business strategist. Provide 1 punchy trend insight and 1 aggressive next step for growth. Max 40 words total. Use sophisticated language.
    `;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });
    return response.text?.trim() || "Revenue trajectory is positive. Optimize cash flow by enforcing strict follow-ups on pending deliverables to secure your capital.";
  }
}
