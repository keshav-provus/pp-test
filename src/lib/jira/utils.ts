export function adfToPlainText(node: any): string {
    if (!node) return "";
    const parts: string[] = [];
    const blocks = new Set(["paragraph", "heading", "listItem"]);
  
    function walk(n: any) {
      if (n.type === "text") {
        parts.push(n.text || "");
      }
      
      if (Array.isArray(n.content)) {
        n.content.forEach(walk);
        if (blocks.has(n.type)) {
          parts.push("\n");
        }
      }
    }
  
    walk(node);
    return parts.join("").trim();
  }