import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { useHelmet, type HelmetScriptTag, type UseHelmetConfig } from "@/hooks/useHelmet";

interface HelmetProps {
  children?: ReactNode;
}

const extractText = (children: ReactNode): string => {
  let text = "";

  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      text += String(child);
      return;
    }

    if (!isValidElement(child)) return;
    text += extractText((child.props as { children?: ReactNode }).children);
  });

  return text;
};

const extractAttributes = (props: Record<string, unknown>) => {
  return Object.entries(props).reduce<Record<string, string | number | boolean | null | undefined>>((acc, [key, value]) => {
    if (key === "children" || key === "dangerouslySetInnerHTML") return acc;
    acc[key] = value as string | number | boolean | null | undefined;
    return acc;
  }, {});
};

const parseHelmetChildren = (children: ReactNode): UseHelmetConfig => {
  const config: UseHelmetConfig = {
    metaTags: [],
    linkTags: [],
    scriptTags: [],
  };

  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === Fragment) {
        walk((child.props as { children?: ReactNode }).children);
        return;
      }

      if (typeof child.type !== "string") return;

      const props = child.props as Record<string, unknown>;

      switch (child.type) {
        case "title":
          config.title = extractText(props.children as ReactNode);
          break;
        case "meta":
          config.metaTags?.push(extractAttributes(props));
          break;
        case "link":
          config.linkTags?.push(extractAttributes(props));
          break;
        case "script": {
          const scriptTag: HelmetScriptTag = {
            attributes: extractAttributes(props),
            innerHTML:
              typeof props.dangerouslySetInnerHTML === "object" &&
              props.dangerouslySetInnerHTML !== null &&
              "__html" in props.dangerouslySetInnerHTML
                ? String((props.dangerouslySetInnerHTML as { __html: unknown }).__html ?? "")
                : extractText(props.children as ReactNode),
          };

          config.scriptTags?.push(scriptTag);
          break;
        }
        default:
          break;
      }
    });
  };

  walk(children);

  return config;
};

export function Helmet({ children }: HelmetProps) {
  useHelmet(parseHelmetChildren(children));
  return null;
}

export default Helmet;