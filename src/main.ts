import { Configuration, OpenAIApi } from "openai";
import { getInput, debug, setOutput, setFailed } from "@actions/core";
import { chatSchema, completionsSchema, modeSchema } from "./schemas";

export async function run() {
  try {
    const apiKey = getInput("openai-api-key");
    const configuration = new Configuration({
      apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const modeSafeParseResult = modeSchema.safeParse(getInput("openai-mode"));

    if (!modeSafeParseResult.success) {
      setFailed(`Invalid mode: ${modeSafeParseResult.error}`);
      return;
    }

    const mode = modeSafeParseResult.data;

    debug(`Running in ${mode} mode`);
    debug(`With params: ${JSON.parse(getInput("openai-params"))}`);

    switch (mode) {
      case "chat": {
        const paramsSafeParseResult = chatSchema.safeParse(
          JSON.parse(getInput("openai-params"))
        );

        if (!paramsSafeParseResult.success) {
          setFailed(
            `Invalid params for chat mode: ${paramsSafeParseResult.error}`
          );
          return;
        }

        const response = await openai.createChatCompletion(
          paramsSafeParseResult.data
        );
        const completion = response.data.choices[0].message?.content ?? "";

        setOutput("completion", completion.trim());
        break;
      }

      case "completion": {
        const paramsSafeParseResult = completionsSchema.safeParse(
          JSON.parse(getInput("openai-params"))
        );

        if (!paramsSafeParseResult.success) {
          setFailed(
            `Invalid params for chat mode: ${paramsSafeParseResult.error}`
          );
          return;
        }

        const response = await openai.createCompletion(
          paramsSafeParseResult.data
        );
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
