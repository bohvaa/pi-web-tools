import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import Conf from "conf";
import { Type } from "typebox";

import { providers } from "./providers.ts";

const result = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }], details: {} });

export default function (pi: ExtensionAPI) {
  const config = new Conf<{ provider: string; apiKeys: Record<string, string> }>({
    cwd: getAgentDir(),
    configName: "web-tools",
    configFileMode: 0o600,
  });

  const client = () => {
    const provider = config.get("provider");
    const apiKey = config.get("apiKeys")?.[provider];
    if (!provider || !apiKey) throw new Error("Please run /web-tools to configure a provider and API key first.");

    return providers[provider](apiKey);
  };

  pi.registerCommand("web-tools", {
    description: "Select and configure the web API provider.",

    async handler(_args, ctx) {
      const provider = await ctx.ui.select("web API provider", Object.keys(providers));
      if (provider === undefined) return;

      const apiKey = await ctx.ui.input(`${provider} API key`);
      if (apiKey === undefined) return;

      config.set({ provider, apiKeys: { ...config.get("apiKeys"), [provider]: apiKey } });
    },
  });

  pi.registerTool({
    name: "web_search",
    label: "web search",
    description: "Search the web for information. Returns result titles, URLs, and content snippets.",
    parameters: Type.Object({ query: Type.String({ description: "search query" }) }),

    async execute(_id, { query }) {
      return result(await client().search(query));
    },
  });

  pi.registerTool({
    name: "web_fetch",
    label: "web fetch",
    description: "Fetch the content of a web page. Returns the page URL and extracted Markdown content.",
    parameters: Type.Object({ url: Type.String({ description: "web page URL to fetch" }) }),

    async execute(_id, { url }) {
      return result(await client().fetch(url));
    },
  });
}
