export function getTypeScriptType(type: string) {
  switch (type) {
    case "Decimal":
    case "Int":
    case "Float":
    case "BigInt":
      return "number";
    case "DateTime":
      return "Date";
    case "Boolean":
      return "boolean";
    case "Json":
      return "Record<string, unknown>";
    case "String":
      return "string";
    default:
      return type;
  }
}
