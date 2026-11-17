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

  async switchDemoUser(roleOrEmail) {
    const res = await fetch(`${API_BASE}/auth/switch-demo-user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roleOrEmail }),
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

  async inviteMember(data) {
    const res = await fetch(`${API_BASE}/family/members/invite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateMemberPermissions(id, data) {
    const res = await fetch(`${API_BASE}/family/members/${id}/permissions`, {
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

  async getSignedUrl(id) {
    const res = await fetch(`${API_BASE}/documents/${id}/signed-url`, {
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

  async renewDocument(id, data) {
    const res = await fetch(`${API_BASE}/documents/${id}/renew`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
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

  async verifyIntegrity(documentId) {
    const res = await fetch(`${API_BASE}/documents/verify-integrity`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ documentId }),
    });
    return res.json();
  },

  // Audit
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/audit?${query}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getCryptographicManifest() {
    const res = await fetch(`${API_BASE}/audit/manifest`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Quorum
  async getQuorumRequests() {
    const res = await fetch(`${API_BASE}/quorum`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async requestQuorum(data) {
    const res = await fetch(`${API_BASE}/quorum/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async signQuorum(id, signerEmail) {
    const res = await fetch(`${API_BASE}/quorum/${id}/sign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ signerEmail }),
    });
    return res.json();
  },

  // Break Glass
  async getBreakGlass() {
    const res = await fetch(`${API_BASE}/break-glass`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async armBreakGlass(data) {
    const res = await fetch(`${API_BASE}/break-glass/arm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async cancelBreakGlass() {
    const res = await fetch(`${API_BASE}/break-glass/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async triggerBreakGlass() {
    const res = await fetch(`${API_BASE}/break-glass/trigger`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async createCategory(data) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return res.json();
  },
};
