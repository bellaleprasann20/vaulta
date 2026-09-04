/**
 * Addition — not in your original services/ list. GET /stars returns a
 * combined { files, folders } payload (backed by the backend's
 * star_service.py, which was the same kind of addition on that side),
 * so it doesn't cleanly belong inside fileService or folderService
 * alone. Individual star/unstar toggles still live in fileService and
 * folderService as you'd expect — this is only the combined listing.
 */
import api from './api'

export const starsService = {
  async listStarred() {
    const { data } = await api.get('/stars')
    return data // { files, folders }
  },
}

export default starsService