import api from './api'

export const searchService = {
  async search(query, { fileType = null } = {}) {
    const { data } = await api.get('/search', {
      params: { q: query, file_type: fileType },
    })
    return data // { files, folders }
  },
}

export default searchService