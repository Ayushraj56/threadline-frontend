const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TOKEN_KEY = "threadline_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Drop-in replacement for fetch() that automatically attaches the
// Authorization header when a token is stored. Use this everywhere
// instead of raw fetch() for calls to the backend.
export async function authFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // keep this too, harmless, helps same-site/local dev
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return res;
}

async function request(path, options = {}) {
  const res = await authFetch(path, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const api = {
  signup: async (payload) => {
    const data = await request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.token) setToken(data.token);
    return data;
  },
  login: async (payload) => {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.token) setToken(data.token);
    return data;
  },
  logout: async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  },
  me: () => request("/api/auth/me"),
};