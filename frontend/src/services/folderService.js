import api from './api'

export const folderService = {
  async getRootContents() {
    const { data } = await api.get('/folders/root')
    return data
  },

  async getContents(folderId) {
    const { data } = await api.get(`/folders/${folderId}`)
    return data
  },

  async create({ name, parentId = null }) {
    const { data } = await api.post('/folders', { name, parent_id: parentId })
    return data
  },

  async rename(folderId, name) {
    const { data } = await api.patch(`/folders/${folderId}`, { name })
    return data
  },

  async move(folderId, parentId) {
    const { data } = await api.patch(`/folders/${folderId}`, { parent_id: parentId })
    return data
  },

  async trash(folderId) {
    await api.delete(`/folders/${folderId}`)
  },

  async deletePermanently(folderId) {
    await api.delete(`/folders/${folderId}`, { params: { permanent: true } })
  },

  async star(folderId) {
    const { data } = await api.post(`/stars/folders/${folderId}`)
    return data
  },

  async unstar(folderId) {
    const { data } = await api.delete(`/stars/folders/${folderId}`)
    return data
  },

  // ---- Trash-specific (mirrors backend's /trash router) ----
  async listTrash() {
    const { data } = await api.get('/trash')
    return data // { files, folders }
  },

  async restoreFile(fileId) {
    const { data } = await api.post(`/trash/files/${fileId}/restore`)
    return data
  },

  async restoreFolder(folderId) {
    const { data } = await api.post(`/trash/folders/${folderId}/restore`)
    return data
  },

  async emptyTrash() {
    const { data } = await api.delete('/trash')
    return data
  },
}

export default folderService