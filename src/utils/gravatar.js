/**
 * @file Utility for getting a profile picture from Gravatar.
 * @module utils/gravatar
 * @author Hans Nilsson
 */

import { createHash } from 'node:crypto'

export const gravatarUrl = (email) => {
  const hash = createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
  return `https://gravatar.com/avatar/${hash}?s=256&d=mp`
}
