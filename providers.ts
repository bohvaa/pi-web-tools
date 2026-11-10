import { tavily } from "@tavily/core";

export interface WebProvider {
  search(query: string): Promise<unknown>;
  fetch(url: string): Promise<unknown>;
}

export const providers: Record<string, (apiKey: string) => WebProvider> = {
  tavily: (apiKey) => {
    const client = tavily({ apiKey });

    return {
      search: (query) => client.search(query),
      fetch: async (url) => {
        const data = await client.extract([url]);
        if (data.failedResults.length) throw new Error(data.failedResults[0].error);

        return data;
      },
    };
  },
};
