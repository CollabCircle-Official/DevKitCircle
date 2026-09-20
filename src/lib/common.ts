export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain",
): void {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function friendlyError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Check your input and try again.";
}
