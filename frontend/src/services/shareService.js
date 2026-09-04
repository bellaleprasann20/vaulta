import api from './api'

export const shareService = {
  // ---- User-to-user shares ----
  async create({ fileId = null, folderId = null, email, role }) {
    const { data } = await api.post('/shares', {
      file_id: fileId,
      folder_id: folderId,
      shared_with_email: email,
      role,
    })
    return data
  },

  async listForTarget({ fileId = null, folderId = null }) {
    const { data } = await api.get('/shares', {
      params: { file_id: fileId, folder_id: folderId },
    })
    return data // SharedUserInfo[]
  },

  async listSharedWithMe() {
    const { data } = await api.get('/shares/with-me')
    return data
  },

  async updateRole(shareId, role) {
    const { data } = await api.patch(`/shares/${shareId}`, { role })
    return data
  },

  async revoke(shareId) {
    await api.delete(`/shares/${shareId}`)
  },

  // ---- Public links ----
  async createLink({ fileId, password = null, expiresInHours = null }) {
    const { data } = await api.post('/public-links', {
      file_id: fileId,
      password,
      expires_in_hours: expiresInHours,
    })
    return data
  },

  async listLinksForFile(fileId) {
    const { data } = await api.get(`/public-links/file/${fileId}`)
    return data
  },

  async revokeLink(linkId) {
    await api.delete(`/public-links/${linkId}`)
  },

  /** No-auth endpoint — the Public User access path. */
  async accessPublicLink(token, password = null) {
    const { data } = await api.post(`/public-links/access/${token}`, { password })
    return data
  },
}

export default shareService