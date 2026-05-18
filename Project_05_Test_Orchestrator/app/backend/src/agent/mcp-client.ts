import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Custom tool appended to Playwright MCP tools — gives the LLM a way to
// declare its verdict when execution is complete.
const COMPLETE_TOOL = {
  name: 'complete',
  description: 'End the test case execution with a final verdict',
  inputSchema: {
    type: 'object' as const,
    properties: {
      verdict: { type: 'string', enum: ['PASS', 'FAIL', 'BLOCKED'], description: 'Final result of the test case' },
      reason: { type: 'string', description: 'One-sentence explanation of the verdict' },
      observations: { type: 'string', description: 'Optional: key observations during execution' },
    },
    required: ['verdict', 'reason'],
  },
};

export class PlaywrightMCPClient {
  private client!: Client;
  private transport!: StdioClientTransport;
  private mcpTools: any[] = [];

  async start(headless = true) {
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: headless ? ['@playwright/mcp', '--headless'] : ['@playwright/mcp'],
    });
    this.client = new Client({ name: 'qa-executor', version: '1.0.0' });
    await this.client.connect(this.transport);
    const result = await this.client.listTools();
    this.mcpTools = result.tools;
  }

  /** Strip JSON Schema meta-fields that Anthropic/OpenAI APIs reject */
  private sanitizeSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;
    const cleaned: any = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === '$schema') continue; // Anthropic rejects $schema
      cleaned[k] = Array.isArray(v) ? v.map((i: any) => this.sanitizeSchema(i)) : this.sanitizeSchema(v);
    }
    return cleaned;
  }

  /** Anthropic-format tool definitions (includes custom complete tool) */
  getAnthropicTools(): any[] {
    const tools = this.mcpTools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: this.sanitizeSchema(t.inputSchema),
    }));
    tools.push({ name: COMPLETE_TOOL.name, description: COMPLETE_TOOL.description, input_schema: COMPLETE_TOOL.inputSchema });
    return tools;
  }

  /** OpenAI-format tool definitions (includes custom complete tool) */
  getOpenAITools(): any[] {
    const tools = this.mcpTools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: this.sanitizeSchema(t.inputSchema) },
    }));
    tools.push({
      type: 'function',
      function: { name: COMPLETE_TOOL.name, description: COMPLETE_TOOL.description, parameters: COMPLETE_TOOL.inputSchema },
    });
    return tools;
  }

  /** Execute a browser tool via the MCP server. Returns text result. */
  async callTool(name: string, args: any): Promise<string> {
    if (name === 'complete') {
      // Handled in executor — should not reach here
      return 'complete';
    }
    try {
      const result = await this.client.callTool({ name, arguments: args });
      const content = result.content as any[];
      if (!content?.length) return '(empty response)';
      return content
        .map((c: any) => {
          if (c.type === 'text') return c.text;
          if (c.type === 'image') return `[screenshot: ${c.mimeType}, ${Math.round((c.data?.length || 0) * 0.75 / 1024)}KB]`;
          return JSON.stringify(c);
        })
        .join('\n');
    } catch (err: any) {
      return `ERROR: ${err.message}`;
    }
  }

  async close() {
    try { await this.transport.close(); } catch { /* ignore */ }
  }
}
