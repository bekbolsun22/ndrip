import { Request } from 'express'
import { nip19 } from 'nostr-tools'
import { ADMIN_NPUBS } from '../utils/consts'

// nip98
// async function verifyAuthNostr(
// 	req: Request,
// 	npub: string,
// 	path: string,
// 	minPow = 0,
// ) {
// 	try {
// 		const { type, data: pubkey } = nip19.decode(npub)
// 		if (type !== 'npub') return false

// 		const { authorization = '' } = req.headers
// 		//console.log("req authorization", pubkey, authorization);
// 		if (!authorization.startsWith('Nostr ')) return false
// 		const data = authorization.split(' ')[1].trim()
// 		if (!data) return false

// 		const json = atob(data)
// 		const event = JSON.parse(json)
// 		// console.log("req authorization event", event);

// 		const now = Math.floor(Date.now() / 1000)
// 		if (event.pubkey !== pubkey) return false
// 		if (event.kind !== 27235) return false
// 		if (event.created_at < now - 60 || event.created_at > now + 60)
// 			return false

// 		const pow = countLeadingZeros(event.id)
// 		console.log('pow', pow, 'min', minPow, 'id', event.id)
// 		if (minPow && pow < minPow) return false

// 		const u = event.tags.find((t) => t.length === 2 && t[0] === 'u')?.[1]
// 		const method = event.tags.find(
// 			(t) => t.length === 2 && t[0] === 'method',
// 		)?.[1]
// 		const payload = event.tags.find(
// 			(t) => t.length === 2 && t[0] === 'payload',
// 		)?.[1]
// 		if (method !== req.method) return false

// 		const url = new URL(u)
// 		// console.log({ url })
// 		if (url.origin !== process.env.ORIGIN || url.pathname !== path)
// 			return false

// 		if (req.rawBody.length > 0) {
// 			const hash = digest('sha256', req.rawBody.toString())
// 			// console.log({ hash, payload, body: req.rawBody.toString() })
// 			if (hash !== payload) return false
// 		} else if (payload) {
// 			return false
// 		}

// 		// finally after all cheap checks are done,
// 		// verify the signature
// 		if (!verifySignature(event)) return false

// 		return true
// 	} catch (e) {
// 		console.log('auth error', e)
// 		return false
// 	}
// }

export const auth = async (req: Request): Promise<string | null> => {
	try {
		const npub = req.headers?.authorization || ''
		if (!npub) return null

		const { type } = nip19.decode(npub)
		if (type !== 'npub') return null

		return npub
	} catch (error) {
		console.log('Error in auth: ', error)
		return null
	}
}

export const adminAuth = async (req: Request): Promise<string | null> => {
	try {
		const npub = await auth(req)

		if (!npub || !ADMIN_NPUBS.includes(npub)) return null

		return npub
	} catch (error) {
		console.log('Error in auth: ', error)
		return null
	}
}
