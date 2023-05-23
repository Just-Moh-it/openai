import { Configuration, OpenAIApi } from "openai";
import { getInput, debug, setOutput, setFailed } from "@actions/core";
import { z } from "zod";
import { chatSchema, completionsSchema, modeSchema } from "./schemas";

const parseAndValidate = <T>(schema: z.ZodType<T>, value: string): T => {
  const parsing = schema.safeParse(value);

  if (!parsing.success)
    throw setFailed(`Error while parsing inputs: ${parsing.error.message}`);

  return parsing.data;
};

export async function run(): Promise<void> {
  try {
    const apiKey = getInput("openai-api-key");
    const configuration = new Configuration({
      apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const mode = parseAndValidate(modeSchema, getInput("mode"));

    debug(`Running in ${mode} mode`);
    debug(`With params: ${getInput("openai-params")}`);

    switch (mode) {
      case "chat": {
        const params = parseAndValidate(chatSchema, getInput("openai-params"));

        const response = await openai.createChatCompletion(params);
        const completion = response.data.choices[0].message?.content ?? "";

        setOutput("completion", completion.trim());
        break;
      }

      case "completion": {
        const params = parseAndValidate(
          completionsSchema,
          getInput("openai-params")
        );

        const response = await openai.createCompletion(params);
        const completion = response.data.choices[0].text ?? "";

        // The output of this action is the text from OpenAI trimmed and escaped
        setOutput("completion", completion.trim());
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}

run();
