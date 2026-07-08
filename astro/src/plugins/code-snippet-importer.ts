import fs from 'node:fs';
import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";

interface CodeNode extends Parent {
  type: "code";
  lang?: string | null;
  meta?: string | null;
  value: string;
}

interface CodeSnippetImportOptions {
  snippetsFiles: string[];
}

interface SnippetItemDto {
  id: string;
  language: string | undefined;
  codeBase64: string;
}

interface SnippetsDto {
  snippets: SnippetItemDto[];
}

interface Snippet {
  id: string;
  language: string;
  code: string;
}

function validateSnippetsDtoObject(metadata: SnippetsDto, path: string) {
  //Ensure every value is not null
  if (!metadata) {
    throw new Error(`Snippets JSON file '${path}' is null`);
  }
  if (!metadata.snippets) {
    throw new Error(`Snippets file snippets property is invalid from '${path}'`);
  }
  console.debug(`Snippet metadata has ${metadata.snippets.length} snippets`)
  metadata.snippets.forEach(snippet => {
    if (!snippet.id || !snippet.language || !snippet.codeBase64) {
      throw new Error(`Snippets JSON file as an invalid snippet child item`);
    }
  });
}

async function LoadSnippetsJsonFromPath(filePath: string): Promise<string> {
  if (filePath.toLowerCase().startsWith('http')) {

    const getResult = await fetch(filePath, { method: "GET" });
    if (getResult.ok) {
      return await getResult.text();
    }

    throw new Error(`Error reading snippets JSON from '${filePath}'. Response body: ${await getResult.text()}`);
  }

  //From local path
  return fs.readFileSync(filePath, 'utf8');
}


const ID_RE = /import-code-snippet id="([^"]*)"/;

function codeSnippetImporter(options: CodeSnippetImportOptions) {
  if (!options.snippetsFiles) {
    console.log("No code snippet files to load from.");
    return;
  }

  const snippetsFilePaths = options.snippetsFiles;
  const mappedSnippets = new Map<string, Snippet>();

  //1. Load all snippets by id
  const loadSnippetsPromise = (async () => {
    console.debug("Loading snippets from files...");
    for (const snippetsFilePath of snippetsFilePaths) {
      console.debug(`Reading from snippets file: ${snippetsFilePath}`);
      const json = await LoadSnippetsJsonFromPath(snippetsFilePath);
      const dto = JSON.parse(json) as SnippetsDto;
      validateSnippetsDtoObject(dto, snippetsFilePath);

      for (const snippet of dto.snippets) {
        console.debug(`Loaded code snippet with id: ${snippet.id}`)
        mappedSnippets.set(snippet.id, {
          id: snippet.id,
          language: snippet.language ?? "text",
          code: atob(snippet.codeBase64),
        });
      }
    }
  })();

  //2. Look at all spots using our element, replace it with the markdown
  return async (tree: Node) => {
    await loadSnippetsPromise;

    visit(tree, "code", (node: CodeNode, index: number | null, parent: Parent | null) => {
      if (node.lang !== "snippet" || !parent || index === null) return;

      const metaMatch = node.meta?.match(ID_RE);
      const snippetId = metaMatch ? metaMatch[1] : "default";

      const snippet = mappedSnippets.get(snippetId);
      if (!snippet) {
        throw new Error(`No snippet found for snippet id '${snippetId}'`);
      }

      console.log(`Using code snippet ${snippetId}`);

      const codeNode: CodeNode = {
        type: "code",
        lang: snippet.language,
        meta: null,
        value: snippet.code,
      };

      parent.children.splice(index, 1, codeNode);
    });
  };
};

export default codeSnippetImporter;
