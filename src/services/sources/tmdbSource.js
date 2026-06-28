import { discoverMovies } from '../tmdbServices.js'
import { findDiscoverProgress, setDiscoverProgress } from '../../models/userModel.js'
import { toPoolItem } from '../sources/tmdbMapper.js'

export const tmdbSource = {
  async discover (userId, filters) {
    const page = userId ? await findDiscoverProgress(userId) : 1
    const { results } = await discoverMovies(page, filters)
    if (!results.length) {
      if (userId) await setDiscoverProgress(userId, 1)
      return []
    }
    if (userId) await setDiscoverProgress(userId, page + 1)
    return results.filter(m => m.poster_path).map(toPoolItem)
  }
}
