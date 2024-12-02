import express, { Request } from 'express'
import { DirectMessage, PrismaClient, Send } from '@prisma/client'
import { auth } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'

const userRouter = express.Router()
const prisma = new PrismaClient()

// User API:
// - add_sender(npub, nip46_local_privkey, options: {...}) - add sender with it's nip46 connection
// - add_dm(id, name, content, options: {...}) - create a dm template
// - send_dm(id, dm_id, npub, options: {...}) - schedule send dm to npub
// - schedule_dm(id, from_npub, to_npub, content, options: { when_tm, ... }) - add DM to be sent after when_tm
// - list_dms() - return list of dms
// - list_sends(filters) - return list of sent dms

// - SENDERS:
//  - user: string - npub of the user
//  - npub: string - npub of sender
//  - nip46_local_privkey: string - nip46 session key
//  - add_timestamp: number
//  - primary key: user+npub

// - DMS:
//  - user: string
//  - id: string - externally provided id
//  - content: string
//  - add_timestamp: number
//  - primary key: user+id

// - SENDS:
//  - user: string
//  - id: string - externally provided id
//  - dm_id: string - id of dm to be sent
//  - sender_npub: string - npub of sender
//  - npub: string - npub of receiver
//  - add_timestamp
//  - when_timestamp - min tm after which to send
//  - status: string - todo/sent/error
//  - primary key: user+id

type AddSenderRequestBody = {
	npub: string
	nip46LocalPrivkey: string
	options: any
}

userRouter.post(
	'/add_sender',
	async (req: Request<{}, {}, AddSenderRequestBody>, res) => {
		const user = await auth(req)
		if (!user) {
			res.status(403).json({ error: 'Bad auth' })
			return
		}

		const { npub, nip46LocalPrivkey, options } = req.body
		if (!npub || !nip46LocalPrivkey) {
			res.status(400).json({ error: 'Missing fields' })
			return
		}

		try {
			const sender = await prisma.sender.create({
				data: {
					user,
					npub,
					nip46Key: nip46LocalPrivkey,
					addTimestamp: Math.floor(Date.now() / 1000),
				},
			})
			res.status(201).json({ message: 'Sender added', sender })
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.toString(),
			})
		}
	},
)

type AddDMRequestBody = {
	content: string
}

userRouter.post(
	'/add_dm',
	async (req: Request<{}, {}, AddDMRequestBody>, res) => {
		const user = await auth(req)
		if (!user) {
			res.status(403).json({ error: 'Bad auth' })
			return
		}
		const { content } = req.body

		if (!content) {
			res.status(400).json({ error: 'Missing fields' })
			return
		}

		try {
			const dm = await prisma.directMessage.create({
				data: {
					user,
					content,
					id: uuidv4(),
					addTimestamp: Math.floor(Date.now() / 1000),
				},
			})
			res.status(201).json({ message: 'DM template added', dm })
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.toString(),
			})
		}
	},
)

type SendDMRequestBody = {
	dmId: string
	npub: string
	senderNpub: string
	options: {
		whenTimestamp?: number
	}
}

userRouter.post(
	'/send_dm',
	async (req: Request<{}, {}, SendDMRequestBody>, res) => {
		const user = await auth(req)
		if (!user) {
			res.status(403).json({ error: 'Bad auth' })
			return
		}

		const { dmId, npub, senderNpub, options } = req.body
		if (!dmId || !npub) {
			res.status(400).json({ error: 'Missing fields' })
			return
		}

		try {
			const send = await prisma.send.create({
				data: {
					user,
					id: uuidv4(),
					dmId,
					npub,
					senderNpub,
					addTimestamp: Math.floor(Date.now() / 1000),
					whenTimestamp:
						options?.whenTimestamp || Math.floor(Date.now() / 1000),
					status: 'todo',
				},
			})
			res.status(201).json({ message: 'DM scheduled', send })
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.toString(),
			})
		}
	},
)

type ScheduleDMRequestBody = {
	fromNpub: string
	toNpub: string
	content: string
	options: {
		whenTimestamp?: number
	}
}

userRouter.post(
	'/schedule_dm',
	async (req: Request<{}, {}, ScheduleDMRequestBody>, res) => {
		const user = await auth(req)
		if (!user) {
			res.status(403).json({ error: 'Bad auth' })
			return
		}

		const userNpub = (req as any).user
		const { fromNpub, toNpub, content, options } = req.body
		const when_tm = options?.whenTimestamp || Math.floor(Date.now() / 1000)

		if (!fromNpub || !toNpub || !content) {
			res.status(400).json({ error: 'Missing required fields' })
			return
		}

		if (!when_tm || isNaN(when_tm)) {
			res.status(400).json({ error: 'Invalid or missing when_tm' })
			return
		}

		try {
			const dm = await prisma.directMessage.create({
				data: {
					user,
					content,
					id: uuidv4(),
					addTimestamp: Math.floor(Date.now() / 1000),
				},
			})

			const send = await prisma.send.create({
				data: {
					user: userNpub,
					id: uuidv4(),
					dmId: dm.id,
					senderNpub: fromNpub,
					npub: toNpub,
					addTimestamp: Math.floor(Date.now() / 1000),
					whenTimestamp: when_tm,
					status: 'todo',
				},
			})

			res.status(201).json({ message: 'DM scheduled', send })
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.message,
			})
		}
	},
)

userRouter.get('/list_dms', async (req, res) => {
	try {
		const user = await auth(req)
		if (!user) {
			res.status(403).json({ error: 'Bad auth' })
			return
		}

		const dms: DirectMessage[] = await prisma.directMessage.findMany({
			where: {
				user,
			},
		})
		res.status(200).json(dms)
	} catch (error: any) {
		res.status(500).json({
			error: 'Server error',
			details: error.toString(),
		})
	}
})

type ListSendsRequestBody = {
	limit?: number
}

userRouter.get(
	'/list_sends',
	async (req: Request<{}, {}, ListSendsRequestBody>, res) => {
		try {
			const user = await auth(req)
			if (!user) {
				res.status(403).json({ error: 'Bad auth' })
				return
			}

			const sends: Send[] = await prisma.send.findMany({
				where: {
					user,
				},
			})
			res.status(200).json(sends)
		} catch (error: any) {
			res.status(500).json({
				error: 'Server error',
				details: error.toString(),
			})
		}
	},
)

export default userRouter
