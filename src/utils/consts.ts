import dotenv from 'dotenv'

dotenv.config()

export const ADMIN_NPUBS_STRING = process.env.ADMIN_NPUBS || ''
export const ADMIN_NPUBS = ADMIN_NPUBS_STRING.split(',') || []
export const PORT = process.env.PORT || 3000
