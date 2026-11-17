const API_BASE = '/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('gharvault_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async loginWithGoogle(userData = {}) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async verifyMpin(mpin) {
    const res = await fetch(`${API_BASE}/auth/verify-mpin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mpin }),
    });
    return res.json();
  },

  // Family
  async getFamily() {
    const res = await fetch(`${API_BASE}/family/current`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getEmergencyCard() {
    const res = await fetch(`${API_BASE}/family/emergency-card`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async setupFamily(data) {
    const res = await fetch(`${API_BASE}/family/setup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async joinFamily(data) {
    const res = await fetch(`${API_BASE}/family/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMembers() {
    const res = await fetch(`${API_BASE}/family/members`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getMember(id) {
    const res = await fetch(`${API_BASE}/family/members/${id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async addMember(data) {
    const res = await fetch(`${API_BASE}/family/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateMember(id, data) {
    const res = await fetch(`${API_BASE}/family/members/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Documents
  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/documents?${query}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return res.json();
  },

  async createShareLink(id, options = {}) {
    const res = await fetch(`${API_BASE}/documents/${id}/share-link`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options),
    });
    return res.json();
  },

  async updateWhoCanView(id, whoCanView) {
    const res = await fetch(`${API_BASE}/documents/${id}/who-can-view`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ whoCanView }),
    });
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Activity
  async getRecentActivity() {
    const res = await fetch(`${API_BASE}/audit?limit=20`, {
      headers: getHeaders(),
    });
    return res.json();
  },
};
