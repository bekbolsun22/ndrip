import express, { Request } from 'express'
import { PrismaClient } from '@prisma/client'
import { adminAuth } from '../middleware/auth'

const adminRouter = express.Router()
const prisma = new PrismaClient()

type AddUserRequestBody = {
	npub: string
}

adminRouter.post(
	'/add_user',
	async (req: Request<{}, {}, AddUserRequestBody>, res) => {
		try {
			const adminNpub = await adminAuth(req)

			if (!adminNpub) {
				res.status(403).json({ error: 'Bad auth' })
				return
			}

			const { npub } = req.body

			if (!npub) {
				res.status(400).json({ error: 'Missing npub' })
				return
			}

			await prisma.user.create({
				data: {
					npub,
					adminNpub,
					addTimestamp: Math.floor(Date.now() / 1000),
				},
			})
			res.status(201).json({ message: 'User added' })
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.toString(),
			})
		}
	},
)

export default adminRouter

// - USERS (edited by admins only):
//  - npub: string - user npub
//  - admin_npub: string - who added the user
//  - add_timestamp: number - when was it added, unix timestamp
//  - primary key: npub
