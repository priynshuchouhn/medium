import { Hono } from 'hono'
import { PrismaClient, User } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string,
  },Variables : {
    prisma: any
    user: {user_id: string, email: string}
  }
}>()


// ! Global middleware
app.use('*',  async (c, next) => {
	const prisma =  new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  c.set('prisma', prisma);
  await next()
})

app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)



export default app
