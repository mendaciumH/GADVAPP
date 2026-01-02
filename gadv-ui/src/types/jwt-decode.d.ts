declare module 'jwt-decode' {
  export function jwtDecode<T = Record<string, unknown>>(
    token: string,
    options?: { header?: boolean }
  ): T;
}

