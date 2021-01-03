import URITemplate from "uri-templates";

/**
 * Regular Expression that matches path parameters.
 */
export const pathParameterRegExp = /\{([^/}]+)}/g;

export function isURITemplateMatch(url: string, template: string): boolean {
  const uriTemplate = URITemplate(template);
  // TODO: Fixing $ parsing issue such as $logs container cannot work in strict mode issue
  const result = (uriTemplate.fromUri as any)(url, { strict: true });
  if (result === undefined) {
    return false;
  }

  for (const key in result) {
    if (result.hasOwnProperty(key)) {
      const element = result[key];
      if (element === "") {
        return false;
      }
    }
  }
  return true;
}

export function numberOfPathKeyWords(path: string, template: string): number {
  let count = 0;

  const templateParts = template.split("/").slice(1); // Remove beginning slash "/"
  const pathParts = path.split("/").slice(1);

  for (let i = 0; i < templateParts.length; i++) {
    // If it is a path parameter surrounded by "{" then skip
    if (templateParts[i].match(pathParameterRegExp)) {
      continue;
    }

    if (pathParts[i] === templateParts[i]) {
      count++;
    }
  }

  return count;
}
