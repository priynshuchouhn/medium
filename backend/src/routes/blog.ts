import { Hono } from "hono"
import { verify } from "hono/jwt"

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string,
    }, Variables: {
        prisma: any
        user: { user_id: string, email: string }
    }
}>()

// -------- Middleware to check authorization / athuntection
blogRouter.use('/*', async (c, next) => {
    const token = c.req.header('authorization')?.split(' ')[1];
    if (!token) {
        c.status(401);
        return c.json({ success: false, message: 'No Token Found!' })
    }
    try {
        const decoded = await verify(token, c.env.JWT_SECRET);
        if (!decoded) {
            c.status(403);
            return c.json({ success: false, message: 'Unauthorized' })
        }
        c.set('user', decoded as { user_id: string, email: string })
        await next()
    } catch (error) {
        c.status(500);
        return c.json({ success: false, message: 'Internal server error' })
    }
})


blogRouter.post('/', async (c) => {
    const userId = c.get('user').user_id;
    const prisma = c.get('prisma');
    try {
        const body = await c.req.json();
        const post = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: userId
            }
        });
        return c.json({ success: true, message: 'post added successfully', data: { post } })
    } catch (error) {
        c.status(500);
        return c.json({ success: false, message: 'Internal server error', })
    }
})
blogRouter.put('/', async (c) => {
    const userId = c.get('user').user_id;
    const prisma = c.get('prisma');
    try {
        const body = await c.req.json();
        const post = await prisma.post.update({
            where: {
                post_id: body.post_id,
                authorId: userId
            },
            data: {
                title: body.title,
                content: body.content,

            }
        });
        return c.json({ success: true, message: 'post updated successfully', data: { post } })
    } catch (error) {
        c.status(500);
        return c.json({ success: false, message: 'Internal server error', })
    }
})
blogRouter.get('/:id', async (c) => {
    const post_id = c.req.param('id');
	const prisma = c.get('prisma');
	try {
        const post = await prisma.post.findUnique({
            where: {
                post_id
            }
        });
        return c.json({ success: true, message: 'post fetched successfully', data: { post } })
    } catch (error) {
        c.status(500);
        return c.json({ success: false, message: 'Internal server error', })
    }
})
blogRouter.get('/bulk', async (c) => {
    const prisma = c.get('prisma');
    try {
        const posts = await prisma.post.find({});
        return c.json({ success: true, message: 'posts fetched successfully', data: { posts } })
    } catch (error) {
        c.status(500);
        return c.json({ success: false, message: 'Internal server error', })
    }
})
