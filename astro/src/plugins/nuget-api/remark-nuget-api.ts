/**
 * Remark plugin: :::nuget-api directive
 *
 * Usage in Markdown:
 *
 *   ::nuget-api{package="Duende.IdentityServer" type="IdentityServerOptions"}
 *
 *   ::nuget-api{package="Duende.IdentityServer" type="IdentityServerOptions" version="7.1.0" members="properties"}
 *
 * Attributes:
 *   - package  (required): NuGet package ID
 *   - type     (required): Full or short type name
 *   - version  (optional): Package version (defaults to latest stable)
 *   - members  (optional): Comma-separated list of member categories to show.
 *                           Values: properties, methods, constructors, fields, events, all
 *                           Default: all
 */
import type { Plugin } from "unified";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import { getXmlDocPath } from "./nuget-fetcher.js";
import { parseXmlDoc, type TypeDocumentation, type MemberDoc } from "./xmldoc-parser.js";

interface DirectiveNode extends Node {
  type: "leafDirective" | "containerDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string>;
  children: Node[];
  data?: Record<string, unknown>;
}

function isNugetApiDirective(node: Node): node is DirectiveNode {
  return (
    (node.type === "leafDirective" || node.type === "containerDirective") &&
    (node as DirectiveNode).name === "nuget-api"
  );
}

const remarkNugetApi: Plugin = function () {
  return async (tree: Node) => {
    // Collect all directive nodes first (can't async inside visit)
    const directives: Array<{ node: DirectiveNode; parent: Parent; index: number }> = [];

    visit(tree, (node: Node, index: number | undefined, parent: Parent | undefined) => {
      if (isNugetApiDirective(node) && parent && index !== undefined) {
        directives.push({ node: node as DirectiveNode, parent, index });
      }
    });

    // Process each directive
    for (const { node, parent, index } of directives) {
      const attrs = node.attributes ?? {};
      const packageId = attrs.package;
      const typeName = attrs.type;
      const version = attrs.version;
      const membersFilter = attrs.members ?? "all";

      if (!packageId || !typeName) {
        // Replace with error message
        const errorNode = createHtmlNode(
          `<div class="nuget-api-error">⚠️ <code>::nuget-api</code> requires <code>package</code> and <code>type</code> attributes.</div>`,
        );
        parent.children.splice(index, 1, errorNode);
        continue;
      }

      try {
        const xmlPath = await getXmlDocPath(packageId, version);
        const typeDoc = parseXmlDoc(xmlPath, typeName);

        if (!typeDoc) {
          const errorNode = createHtmlNode(
            `<div class="nuget-api-error">⚠️ Type <code>${typeName}</code> not found in <code>${packageId}</code> XML documentation.</div>`,
          );
          parent.children.splice(index, 1, errorNode);
          continue;
        }

        const html = renderTypeDoc(typeDoc, membersFilter, packageId, version);
        const htmlNode = createHtmlNode(html);
        parent.children.splice(index, 1, htmlNode);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[nuget-api] Error processing directive:`, message);
        const errorNode = createHtmlNode(
          `<div class="nuget-api-error">⚠️ Failed to load API docs for <code>${typeName}</code> from <code>${packageId}</code>: ${escapeHtml(message)}</div>`,
        );
        parent.children.splice(index, 1, errorNode);
      }
    }
  };
};

function createHtmlNode(value: string): Node {
  return {
    type: "html",
    value,
  } as Node;
}

function renderTypeDoc(
  typeDoc: TypeDocumentation,
  membersFilter: string,
  packageId: string,
  version?: string,
): string {
  const filters = membersFilter.split(",").map((s) => s.trim().toLowerCase());
  const showAll = filters.includes("all");

  const versionLabel = version ? `v${version}` : "latest";
  const nugetUrl = `https://www.nuget.org/packages/${packageId}${version ? `/${version}` : ""}`;

  let html = `<div class="nuget-api-docs">`;
  html += `<div class="nuget-api-header">`;
  html += `<h4><code>${typeDoc.fullName}</code></h4>`;
  html += `<span class="nuget-api-badge"><a href="${nugetUrl}" target="_blank" rel="noopener noreferrer">📦 ${packageId} ${versionLabel}</a></span>`;
  html += `</div>`;

  if (typeDoc.summary) {
    html += `<p class="nuget-api-summary">${escapeHtml(typeDoc.summary)}</p>`;
  }

  if (typeDoc.remarks) {
    html += `<p class="nuget-api-remarks"><em>${escapeHtml(typeDoc.remarks)}</em></p>`;
  }

  if ((showAll || filters.includes("constructors")) && typeDoc.constructors.length > 0) {
    html += renderMemberSection("Constructors", typeDoc.constructors);
  }

  if ((showAll || filters.includes("properties")) && typeDoc.properties.length > 0) {
    html += renderMemberSection("Properties", typeDoc.properties);
  }

  if ((showAll || filters.includes("methods")) && typeDoc.methods.length > 0) {
    html += renderMemberSection("Methods", typeDoc.methods);
  }

  if ((showAll || filters.includes("fields")) && typeDoc.fields.length > 0) {
    html += renderMemberSection("Fields", typeDoc.fields);
  }

  if ((showAll || filters.includes("events")) && typeDoc.events.length > 0) {
    html += renderMemberSection("Events", typeDoc.events);
  }

  html += `</div>`;
  return html;
}

function renderMemberSection(title: string, members: MemberDoc[]): string {
  let html = `<details class="nuget-api-section" open>`;
  html += `<summary><strong>${title}</strong> <span class="nuget-api-count">(${members.length})</span></summary>`;
  html += `<table class="nuget-api-table"><thead><tr><th>Name</th><th>Description</th></tr></thead><tbody>`;

  for (const member of members) {
    html += `<tr>`;
    html += `<td><code>${escapeHtml(member.name)}</code>`;

    if (member.params.length > 0) {
      html += `<br/><small>`;
      html += member.params
        .map((p) => `<code>${escapeHtml(p.name)}</code>: ${escapeHtml(p.description)}`)
        .join("<br/>");
      html += `</small>`;
    }

    html += `</td>`;
    html += `<td>${escapeHtml(member.summary)}`;

    if (member.returns) {
      html += `<br/><small><strong>Returns:</strong> ${escapeHtml(member.returns)}</small>`;
    }

    html += `</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table></details>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default remarkNugetApi;
