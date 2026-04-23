import * as fs from "node:fs";
import { JSDOM } from "jsdom";

export interface TypeDocumentation {
  name: string;
  fullName: string;
  summary: string;
  remarks: string;
  properties: MemberDoc[];
  methods: MemberDoc[];
  constructors: MemberDoc[];
  events: MemberDoc[];
  fields: MemberDoc[];
}

export interface MemberDoc {
  name: string;
  signature: string;
  summary: string;
  remarks: string;
  returns: string;
  params: Array<{ name: string; description: string }>;
  value: string;
}

/**
 * Parse a .NET XML documentation file and extract docs for a specific type.
 *
 * Member ID format: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/xmldoc/#id-strings
 *   T:Namespace.TypeName                    — type
 *   P:Namespace.TypeName.PropertyName       — property
 *   M:Namespace.TypeName.MethodName(params) — method
 *   F:Namespace.TypeName.FieldName          — field
 *   E:Namespace.TypeName.EventName          — event
 */
export function parseXmlDoc(
  xmlPath: string,
  typeName: string,
): TypeDocumentation | null {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;

  const members = doc.querySelectorAll("member");

  // Find the type itself (T:Full.Namespace.TypeName)
  let typeNode: Element | null = null;
  let typeFullName = "";

  for (const member of members) {
    const name = member.getAttribute("name") ?? "";
    if (name.startsWith("T:") && name.endsWith(`.${typeName}`)) {
      typeNode = member;
      typeFullName = name.substring(2); // strip "T:"
      break;
    }
    // Also match exact full name
    if (name === `T:${typeName}`) {
      typeNode = member;
      typeFullName = typeName;
      break;
    }
  }

  if (!typeNode) return null;

  const result: TypeDocumentation = {
    name: typeName.includes(".") ? typeName.split(".").pop()! : typeName,
    fullName: typeFullName,
    summary: getTextContent(typeNode, "summary"),
    remarks: getTextContent(typeNode, "remarks"),
    properties: [],
    methods: [],
    constructors: [],
    events: [],
    fields: [],
  };

  // Collect members belonging to this type
  const prefix = typeFullName + ".";

  for (const member of members) {
    const name = member.getAttribute("name") ?? "";

    if (name.startsWith(`P:${prefix}`)) {
      result.properties.push(parseMember(member, `P:${prefix}`));
    } else if (name.startsWith(`M:${prefix}.#ctor`)) {
      result.constructors.push(parseMember(member, `M:${prefix}`));
    } else if (name.startsWith(`M:${prefix}`)) {
      result.methods.push(parseMember(member, `M:${prefix}`));
    } else if (name.startsWith(`F:${prefix}`)) {
      result.fields.push(parseMember(member, `F:${prefix}`));
    } else if (name.startsWith(`E:${prefix}`)) {
      result.events.push(parseMember(member, `E:${prefix}`));
    }
  }

  return result;
}

function parseMember(element: Element, prefixToStrip: string): MemberDoc {
  const fullName = element.getAttribute("name") ?? "";
  const rawName = fullName.substring(prefixToStrip.length);

  // Clean up method signatures for display
  const name = rawName.replace(/\(.*\)/, "");
  const signature = rawName;

  const params: Array<{ name: string; description: string }> = [];
  for (const param of element.querySelectorAll("param")) {
    params.push({
      name: param.getAttribute("name") ?? "",
      description: cleanText(param.textContent ?? ""),
    });
  }

  return {
    name,
    signature,
    summary: getTextContent(element, "summary"),
    remarks: getTextContent(element, "remarks"),
    returns: getTextContent(element, "returns"),
    params,
    value: getTextContent(element, "value"),
  };
}

function getTextContent(parent: Element, tagName: string): string {
  const el = parent.querySelector(`:scope > ${tagName}`);
  if (!el) return "";
  return cleanText(el.textContent ?? "");
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
