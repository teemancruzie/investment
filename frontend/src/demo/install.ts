/** Routes browser calls to the API through the in-browser demo server when demo mode is on. */
export const DEMO_MODE = String(import.meta.env["VITE_DEMO_MODE"] ?? "") === "true";

let installed = false;

export function installDemoFetch(apiUrl: string) {
  if (!DEMO_MODE || installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  const base = apiUrl.replace(/\/+$/, "");

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(base)) return realFetch(input, init);

    const { handleDemoRequest } = await import("./mockApi");
    const headers = new Headers(init?.headers);
    const auth = headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

    let body: Record<string, unknown> | null = null;
    if (init?.body instanceof FormData) {
      const file = init.body.get("file");
      if (file instanceof File) {
        body = {
          dataUrl: await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
        };
      }
    } else if (typeof init?.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = null; }
    }

    await new Promise((r) => setTimeout(r, 150));
    const result = await handleDemoRequest((init?.method ?? "GET").toUpperCase(), url.slice(base.length) || "/", body, token);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}
