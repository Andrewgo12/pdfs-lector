/**
 * Cliente API base para comunicación con el backend Laravel
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch genérico con manejo de errores
 */
export async function apiFetch(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    let json = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      json = await response.json();
    }

    return {
      ok: response.ok,
      status: response.status,
      json,
      response,
    };
  } catch (error) {
    console.error('[API] Error en fetch:', error);
    return {
      ok: false,
      status: 0,
      json: null,
      error: error.message,
    };
  }
}

/**
 * POST con FormData (multipart)
 */
export async function postMultipart(endpoint, formData) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: formData,
    // No establecer Content-Type, el navegador lo hace automáticamente con boundary
  });
}

/**
 * POST con JSON
 */
export async function postJSON(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * GET simple
 */
export async function getJSON(endpoint) {
  return apiFetch(endpoint, {
    method: 'GET',
  });
}

/**
 * PUT con JSON
 */
export async function putJSON(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * DELETE
 */
export async function deleteRequest(endpoint) {
  return apiFetch(endpoint, {
    method: 'DELETE',
  });
}
