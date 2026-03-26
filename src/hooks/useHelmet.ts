import { useEffect, useRef } from "react";

type HeadAttributeValue = string | number | boolean | null | undefined;
type HeadAttributes = Record<string, HeadAttributeValue>;

export interface HelmetScriptTag {
  attributes?: HeadAttributes;
  innerHTML?: string;
}

export interface UseHelmetConfig {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  metaTags?: HeadAttributes[];
  linkTags?: HeadAttributes[];
  scriptTags?: HelmetScriptTag[];
}

interface ActiveHelmetEntry {
  config: NormalizedHelmetConfig;
  order: number;
}

interface NormalizedHelmetConfig {
  title?: string;
  metaTags: Record<string, string>[];
  linkTags: Record<string, string>[];
  scriptTags: Array<{ attributes: Record<string, string>; innerHTML?: string }>;
}

interface NodeSnapshot {
  attributes: Array<[string, string]>;
  tagName: string;
  textContent: string | null;
}

const MANAGED_ATTR = "data-managed-by";
const MANAGED_VALUE = "use-helmet";
const MANAGED_KEY_ATTR = "data-helmet-key";

const activeHelmetEntries = new Map<number, ActiveHelmetEntry>();
const baselineNodes = new Map<string, NodeSnapshot | null>();

let baselineTitle: string | null = null;
let helmetIdCounter = 0;
let helmetOrderCounter = 0;

const serializeAttributes = (attributes?: HeadAttributes) => {
  if (!attributes) return {};

  return Object.entries(attributes).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === false) return acc;

    const normalizedKey =
      key === "httpEquiv"
        ? "http-equiv"
        : key === "charSet"
          ? "charset"
          : key === "itemProp"
            ? "itemprop"
            : key;

    acc[normalizedKey] = value === true ? "true" : String(value);
    return acc;
  }, {});
};

const normalizeHelmetConfig = (config: UseHelmetConfig): NormalizedHelmetConfig => {
  const metaTags: Record<string, string>[] = [];
  const linkTags: Record<string, string>[] = [];
  const scriptTags = (config.scriptTags ?? []).map((scriptTag) => ({
    attributes: serializeAttributes(scriptTag.attributes),
    innerHTML: scriptTag.innerHTML,
  }));

  if (config.description) metaTags.push({ name: "description", content: config.description });
  if (config.robots) metaTags.push({ name: "robots", content: config.robots });
  if (config.ogTitle) metaTags.push({ property: "og:title", content: config.ogTitle });
  if (config.ogDescription) metaTags.push({ property: "og:description", content: config.ogDescription });
  if (config.ogUrl) metaTags.push({ property: "og:url", content: config.ogUrl });
  if (config.ogImage) metaTags.push({ property: "og:image", content: config.ogImage });
  if (config.ogType) metaTags.push({ property: "og:type", content: config.ogType });
  if (config.twitterCard) metaTags.push({ name: "twitter:card", content: config.twitterCard });

  metaTags.push(...(config.metaTags ?? []).map(serializeAttributes).filter((tag) => Object.keys(tag).length > 0));

  if (config.canonical) linkTags.push({ rel: "canonical", href: config.canonical });
  linkTags.push(...(config.linkTags ?? []).map(serializeAttributes).filter((tag) => Object.keys(tag).length > 0));

  return {
    title: config.title,
    metaTags,
    linkTags,
    scriptTags,
  };
};

const escapeSelectorValue = (value: string) => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/(["\\])/g, "\\$1");
};

const createNodeSnapshot = (node: Element): NodeSnapshot => ({
  tagName: node.tagName.toLowerCase(),
  textContent: node.textContent,
  attributes: Array.from(node.attributes).map((attribute) => [attribute.name, attribute.value]),
});

const clearManagedAttributes = (node: Element) => {
  node.removeAttribute(MANAGED_ATTR);
  node.removeAttribute(MANAGED_KEY_ATTR);
};

const applySnapshot = (node: HTMLElement, snapshot: NodeSnapshot | null) => {
  if (!snapshot) {
    node.remove();
    return;
  }

  Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name));
  snapshot.attributes.forEach(([name, value]) => node.setAttribute(name, value));
  node.textContent = snapshot.textContent;
  clearManagedAttributes(node);
};

const applyAttributes = (node: HTMLElement, attributes: Record<string, string>) => {
  Array.from(node.attributes).forEach((attribute) => {
    if (attribute.name === MANAGED_ATTR || attribute.name === MANAGED_KEY_ATTR) return;
    node.removeAttribute(attribute.name);
  });

  Object.entries(attributes).forEach(([name, value]) => {
    node.setAttribute(name, value);
  });
};

const getMetaKey = (attributes: Record<string, string>) => {
  if (attributes.name) return `meta:name:${attributes.name.toLowerCase()}`;
  if (attributes.property) return `meta:property:${attributes.property.toLowerCase()}`;
  if (attributes["http-equiv"]) return `meta:http-equiv:${attributes["http-equiv"].toLowerCase()}`;
  if (attributes.charset) return "meta:charset";
  return `meta:custom:${JSON.stringify(attributes)}`;
};

const getMetaSelector = (attributes: Record<string, string>) => {
  if (attributes.name) return `meta[name="${escapeSelectorValue(attributes.name)}"]`;
  if (attributes.property) return `meta[property="${escapeSelectorValue(attributes.property)}"]`;
  if (attributes["http-equiv"]) return `meta[http-equiv="${escapeSelectorValue(attributes["http-equiv"])}"]`;
  if (attributes.charset) return "meta[charset]";
  return null;
};

const getLinkKey = (attributes: Record<string, string>) => {
  if (attributes.id) return `link:id:${attributes.id}`;
  if (attributes.rel === "canonical") return "link:rel:canonical";
  if (attributes.rel && attributes.hreflang) {
    return `link:rel:${attributes.rel.toLowerCase()}:hreflang:${attributes.hreflang.toLowerCase()}`;
  }
  if (attributes.rel) return `link:rel:${attributes.rel.toLowerCase()}`;
  return `link:custom:${JSON.stringify(attributes)}`;
};

const getLinkSelector = (attributes: Record<string, string>) => {
  if (attributes.id) return `link#${escapeSelectorValue(attributes.id)}`;
  if (attributes.rel === "canonical") return 'link[rel="canonical"]';
  if (attributes.rel && attributes.hreflang) {
    return `link[rel="${escapeSelectorValue(attributes.rel)}"][hreflang="${escapeSelectorValue(attributes.hreflang)}"]`;
  }
  if (attributes.rel) return `link[rel="${escapeSelectorValue(attributes.rel)}"]`;
  return null;
};

const simpleHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const getScriptKey = (script: { attributes: Record<string, string>; innerHTML?: string }) => {
  if (script.attributes.id) return `script:id:${script.attributes.id}`;

  const descriptor = `${script.attributes.type ?? "script"}:${script.innerHTML ?? ""}`;
  return `script:${simpleHash(descriptor)}`;
};

const getManagedNode = (tagName: string, key: string) => {
  return document.head.querySelector<HTMLElement>(
    `${tagName}[${MANAGED_ATTR}="${MANAGED_VALUE}"][${MANAGED_KEY_ATTR}="${escapeSelectorValue(key)}"]`
  );
};

const syncElements = <T extends { attributes: Record<string, string>; innerHTML?: string }>(params: {
  createElement: (element: T) => HTMLElement;
  desiredElements: T[];
  getElementKey: (element: T) => string;
  getExistingSelector?: (element: T) => string | null;
  tagName: string;
}) => {
  const { createElement, desiredElements, getElementKey, getExistingSelector, tagName } = params;

  const desiredKeys = new Set<string>();

  desiredElements.forEach((element) => {
    const key = getElementKey(element);
    desiredKeys.add(key);

    const selector = getExistingSelector?.(element) ?? null;
    let node = getManagedNode(tagName, key);

    if (!baselineNodes.has(key)) {
      const existingNode = selector
        ? document.head.querySelector<HTMLElement>(selector)
        : null;

      baselineNodes.set(key, existingNode ? createNodeSnapshot(existingNode) : null);

      if (!node && existingNode) {
        node = existingNode;
      }
    }

    if (!node) {
      node = createElement(element);
      document.head.appendChild(node);
    }

    node.setAttribute(MANAGED_ATTR, MANAGED_VALUE);
    node.setAttribute(MANAGED_KEY_ATTR, key);

    if (tagName === "script") {
      applyAttributes(node, element.attributes);
      node.textContent = element.innerHTML ?? "";
    } else {
      applyAttributes(node, element.attributes);
    }
  });

  Array.from(document.head.querySelectorAll<HTMLElement>(`${tagName}[${MANAGED_ATTR}="${MANAGED_VALUE}"]`)).forEach((node) => {
    const key = node.getAttribute(MANAGED_KEY_ATTR);
    if (!key || desiredKeys.has(key)) return;

    applySnapshot(node, baselineNodes.get(key) ?? null);
  });
};

const reconcileHelmet = () => {
  if (typeof document === "undefined") return;

  const orderedEntries = Array.from(activeHelmetEntries.values())
    .sort((entryA, entryB) => entryA.order - entryB.order)
    .map((entry) => entry.config);

  let title: string | undefined;
  const metaMap = new Map<string, Record<string, string>>();
  const linkMap = new Map<string, Record<string, string>>();
  const scriptMap = new Map<string, { attributes: Record<string, string>; innerHTML?: string }>();

  orderedEntries.forEach((entry) => {
    if (entry.title !== undefined) title = entry.title;

    entry.metaTags.forEach((metaTag) => {
      metaMap.set(getMetaKey(metaTag), metaTag);
    });

    entry.linkTags.forEach((linkTag) => {
      linkMap.set(getLinkKey(linkTag), linkTag);
    });

    entry.scriptTags.forEach((scriptTag) => {
      scriptMap.set(getScriptKey(scriptTag), scriptTag);
    });
  });

  if (baselineTitle === null) {
    baselineTitle = document.title;
  }

  document.title = title ?? baselineTitle;

  syncElements({
    tagName: "meta",
    desiredElements: Array.from(metaMap.values()).map((attributes) => ({ attributes })),
    getElementKey: (element) => getMetaKey(element.attributes),
    getExistingSelector: (element) => getMetaSelector(element.attributes),
    createElement: () => document.createElement("meta"),
  });

  syncElements({
    tagName: "link",
    desiredElements: Array.from(linkMap.values()).map((attributes) => ({ attributes })),
    getElementKey: (element) => getLinkKey(element.attributes),
    getExistingSelector: (element) => getLinkSelector(element.attributes),
    createElement: () => document.createElement("link"),
  });

  syncElements({
    tagName: "script",
    desiredElements: Array.from(scriptMap.values()),
    getElementKey: getScriptKey,
    createElement: () => document.createElement("script"),
  });
};

export function useHelmet(config: UseHelmetConfig) {
  const entryIdRef = useRef<number>();
  const orderRef = useRef<number>();
  const normalizedConfigRef = useRef<NormalizedHelmetConfig>(normalizeHelmetConfig(config));

  if (entryIdRef.current === undefined) {
    helmetIdCounter += 1;
    entryIdRef.current = helmetIdCounter;
  }

  if (orderRef.current === undefined) {
    helmetOrderCounter += 1;
    orderRef.current = helmetOrderCounter;
  }

  normalizedConfigRef.current = normalizeHelmetConfig(config);

  useEffect(() => {
    const entryId = entryIdRef.current!;

    activeHelmetEntries.set(entryId, {
      order: orderRef.current!,
      config: normalizedConfigRef.current,
    });

    reconcileHelmet();

    return () => {
      activeHelmetEntries.delete(entryId);
      reconcileHelmet();
    };
  }, []);

  useEffect(() => {
    const entryId = entryIdRef.current!;
    const existingEntry = activeHelmetEntries.get(entryId);
    if (!existingEntry) return;

    existingEntry.config = normalizedConfigRef.current;
    reconcileHelmet();
  }, [config]);
}