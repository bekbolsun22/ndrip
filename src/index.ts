import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import adminRouter from './routes/admin'
import userRouter from './routes/user'
import { PORT } from './utils/consts'

const app = express()
app.use(express.json())
app.use(cors())

app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.use((req: Request, res: Response) => {
	res.status(500).send({
		status: 'error',
		message: 'An internal error occurred',
	})
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
