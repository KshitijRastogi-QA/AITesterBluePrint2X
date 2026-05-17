import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { LLMConfig } from '../routes/llm';

export const getLLMClient = (config: LLMConfig): BaseChatModel => {
    switch (config.provider) {
        case 'openai':
            return new ChatOpenAI({
                openAIApiKey: config.apiKey,
                modelName: config.model || 'gpt-4o',
            });
        case 'claude':
            return new ChatAnthropic({
                anthropicApiKey: config.apiKey,
                modelName: config.model || 'claude-3-5-sonnet-20240620',
            });
        case 'gemini':
            return new ChatGoogleGenerativeAI({
                apiKey: config.apiKey,
                model: config.model || 'gemini-1.5-flash',
            });
        case 'ollama':
            return new ChatOllama({
                baseUrl: config.baseUrl || 'http://localhost:11434',
                model: config.model || 'gemma3:1b',
            });
        case 'lmstudio':
            return new ChatOpenAI({
                openAIApiKey: 'lm-studio', // Not strictly required, but usually expected
                configuration: {
                    baseURL: config.baseUrl || 'http://localhost:1234/v1',
                },
                modelName: config.model || 'local-model',
            });
        case 'groq':
            return new ChatOpenAI({
                openAIApiKey: config.apiKey,
                configuration: {
                    baseURL: 'https://api.groq.com/openai/v1',
                },
                modelName: config.model || 'llama3-8b-8192',
            });
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
};

export const generateTestCasesWithLLM = async (requirement: string, config: LLMConfig): Promise<string> => {
    const llm = getLLMClient(config);

    const systemPrompt = `You are an expert QA Engineer. Your job is to strictly output test cases for the given Jira requirement.
You must output BOTH Functional and Non-Functional test cases.
Format the output carefully to match Jira description structures (using Markdown bullet points and bold headers). 
Do NOT include pleasantries, introductory, or concluding remarks. Just the test cases.

Use the following format strictly:

*Functional Test Cases*

1. **Test Case Name**
- *Steps*: Step 1, Step 2.
- *Expected*: Expected result.

*Non-Functional Test Cases*

1. **Test Case Name**
- *Steps*: Step 1.
- *Expected*: Expected result.
`;

    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(`Create test cases for the following Jira requirement:\n\n${requirement}`)
    ]);

    return response.content.toString();
};
