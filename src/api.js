const API_BASE = 'http://localhost:5000';

export function createApiClient(getToken) {
  const apiFetch = async (path, options = {}) => {
    const token = await getToken();

    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set(
        'Authorization',
        `Bearer ${token}`
      );
    }

    if (
      options.body &&
      !headers.has('Content-Type')
    ) {
      headers.set(
        'Content-Type',
        'application/json'
      );
    }

    return fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers,
        credentials: 'include',
      }
    );
  };

  return {
    get: (path) =>
      apiFetch(path),

    post: (path, body) =>
      apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    put: (path, body) =>
      apiFetch(path, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    delete: (path) =>
      apiFetch(path, {
        method: 'DELETE',
      }),
  };
}

export { API_BASE };
