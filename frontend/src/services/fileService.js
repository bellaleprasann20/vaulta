import api from './api'

export const fileService = {
  async list(folderId = null) {
    const { data } = await api.get('/files', { params: folderId ? { folder_id: folderId } : {} })
    return data
  },

  async get(fileId) {
    const { data } = await api.get(`/files/${fileId}`)
    return data
  },

  /**
   * Full upload flow: init -> PUT bytes to the signed URL -> complete.
   * `onProgress(percent)` fires during the PUT — this is why it uses
   * axios's own onUploadProgress instead of a second XHR, unlike the
   * page-local version that existed before this service did.
   */
  async upload({ file, folderId = null, onProgress }) {
    const { data: initData } = await api.post('/files/init-upload', {
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      folder_id: folderId,
    })

    await api.put(initData.upload_url, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      // Signed storage URLs don't need our Bearer token or the withCredentials
      // cookie — sending them can even break some providers' signature checks.
      withCredentials: false,
      transformRequest: (data, headers) => {
        delete headers.Authorization
        return data
      },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      },
    })

    const { data: file_record } = await api.post('/files/complete-upload', {
      storage_key: initData.storage_key,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      folder_id: folderId,
    })
    return file_record
  },

  async rename(fileId, name) {
    const { data } = await api.patch(`/files/${fileId}`, { name })
    return data
  },

  async move(fileId, folderId) {
    const { data } = await api.patch(`/files/${fileId}`, { folder_id: folderId })
    return data
  },

  async trash(fileId) {
    await api.delete(`/files/${fileId}`)
  },

  async deletePermanently(fileId) {
    await api.delete(`/files/${fileId}`, { params: { permanent: true } })
  },

  async getDownloadUrl(fileId) {
    const { data } = await api.get(`/files/${fileId}/download`)
    return data.download_url
  },

  async listVersions(fileId) {
    const { data } = await api.get(`/files/${fileId}/versions`)
    return data
  },

  async star(fileId) {
    const { data } = await api.post(`/files/${fileId}/star`)
    return data
  },

  async unstar(fileId) {
    const { data } = await api.delete(`/files/${fileId}/star`)
    return data
  },
}

export default fileService