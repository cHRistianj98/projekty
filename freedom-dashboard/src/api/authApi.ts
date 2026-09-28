const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8080";

const TOKEN_KEY = "freedom-auth-token";

type LoginResponse = {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
};

type RegisterResponse = {
  id: number;
  email: string;
};

type CurrentUserResponse = {
  id: number;
  email: string;
};

async function readJson<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `API ${response.status}: ${
        body || response.statusText
      }`
    );
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  async register(
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    const response = await fetch(
      `${API_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    return readJson<RegisterResponse>(
      response
    );
  },

  async login(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    return readJson<LoginResponse>(
      response
    );
  },

  async me(): Promise<CurrentUserResponse> {
    const token = this.getToken();

    if (!token) {
      throw new Error("Brak tokenu JWT");
    }

    const response = await fetch(
      `${API_URL}/api/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return readJson<CurrentUserResponse>(
      response
    );
  },

  saveToken(token: string) {
    localStorage.setItem(
      TOKEN_KEY,
      token
    );
  },

  getToken(): string | null {
    return localStorage.getItem(
      TOKEN_KEY
    );
  },

  removeToken() {
    localStorage.removeItem(
      TOKEN_KEY
    );
  },

  isLoggedIn(): boolean {
    return Boolean(
      localStorage.getItem(TOKEN_KEY)
    );
  },
};
