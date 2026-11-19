const API_BASE = '/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('gharvault_token');
  const userStr = localStorage.getItem('gharvault_user');
  let familyId = null;
  try {
    if (userStr) {
      const u = JSON.parse(userStr);
      familyId = u?.familyId?._id || u?.familyId;
    }
  } catch (e) {}

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (familyId) {
    headers['x-family-id'] = familyId.toString();
  }
  return headers;
};

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // Non-JSON response
  }

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  // Auth
  async syncAuth(userData = {}) {
    return request(`${API_BASE}/auth/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
  },

  async loginWithGoogle(userData = {}) {
    return request(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
  },

  async getMe() {
    return request(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
  },

  async verifyMpin(mpin) {
    return request(`${API_BASE}/auth/verify-mpin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mpin }),
    });
  },

  async setMpin(mpin) {
    return request(`${API_BASE}/auth/set-mpin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mpin }),
    });
  },

  // User Profile
  async getProfile() {
    return request(`${API_BASE}/users/profile`, {
      headers: getHeaders(),
    });
  },

  async updateProfile(profileData) {
    return request(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
  },

  async uploadAvatar(formData) {
    return request(`${API_BASE}/users/avatar`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
  },

  // Family
  async getFamily() {
    return request(`${API_BASE}/family/current`, {
      headers: getHeaders(),
    });
  },

  async getEmergencyCard() {
    return request(`${API_BASE}/family/emergency-card`, {
      headers: getHeaders(),
    });
  },

  async setupFamily(data) {
    return request(`${API_BASE}/family/setup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async joinFamily(data) {
    return request(`${API_BASE}/family/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async getMembers() {
    return request(`${API_BASE}/family/members`, {
      headers: getHeaders(),
    });
  },

  async getMember(id) {
    return request(`${API_BASE}/family/members/${id}`, {
      headers: getHeaders(),
    });
  },

  async addMember(data) {
    return request(`${API_BASE}/family/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async updateMember(id, data) {
    return request(`${API_BASE}/family/members/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async transferOwnership(newAdminId) {
    return request(`${API_BASE}/family/transfer-ownership`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newAdminId }),
    });
  },

  async deleteMember(id, options = {}) {
    const params = new URLSearchParams();
    if (options.deleteDocuments) params.append('deleteDocuments', 'true');
    if (options.keepOldCopy !== undefined) params.append('keepOldCopy', String(options.keepOldCopy));
    const query = params.toString() ? `?${params.toString()}` : '';

    return request(`${API_BASE}/family/members/${id}${query}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(options),
    });
  },

  // Documents
  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/documents?${query}`, {
      headers: getHeaders(),
    });
  },

  async getDocument(id) {
    return request(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
  },

  async uploadDocument(formData) {
    return request(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
  },

  async createShareLink(id, options = {}) {
    return request(`${API_BASE}/documents/${id}/share-link`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options),
    });
  },

  async revokeShareLink(id) {
    return request(`${API_BASE}/documents/${id}/share-link`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  async getSharedDocument(token) {
    return request(`${API_BASE}/documents/shared/${token}`);
  },

  async updateWhoCanView(id, whoCanView) {
    return request(`${API_BASE}/documents/${id}/who-can-view`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ whoCanView }),
    });
  },

  async updateMpinProtection(id, isMpinProtected) {
    return request(`${API_BASE}/documents/${id}/mpin-protection`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isMpinProtected }),
    });
  },

  async deleteDocument(id) {
    return request(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Categories
  async getCategories() {
    return request(`${API_BASE}/categories`, {
      headers: getHeaders(),
    });
  },

  async createCategory(catData) {
    return request(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(catData),
    });
  },

  // Activity & Audit Ledger
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`${API_BASE}/audit?${query}`, {
      headers: getHeaders(),
    });
  },

  async getRecentActivity() {
    return request(`${API_BASE}/audit?limit=20`, {
      headers: getHeaders(),
    });
  },

  async verifyAuditChain() {
    return request(`${API_BASE}/audit/verify`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  async getCryptographicManifest() {
    return request(`${API_BASE}/audit/manifest`, {
      headers: getHeaders(),
    });
  },
};
