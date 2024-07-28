import { Hono } from "hono"
import { sign } from "hono/jwt"


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string,
    }, Variables: {
        prisma: any
        user: { user_id: string, email: string }
    }
}>()

// ! For Authentication 

// ------------- Sign up user ---------------------- //
userRouter.post('/signup', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  if (!body.password || !body.email) {
    c.status(411)
    return c.json({ success: false, message: "Required fields missing" });
  }
  try {
  const encoder = new TextEncoder();
  const data = encoder.encode(body.password);
  const hashBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword
      }
    });
    const jwt = await sign({ id: user.user_id, email: user.email }, c.env.JWT_SECRET);
    return c.json({ success: true, data:{token: jwt}, message: 'User registered successfully!' });
  } catch (e) {
    console.log(e);
    c.status(500);
    return c.json({ success: false, message: "error while signing up" });
  }
})


// ------------- Sign In user ---------------------- //
userRouter.post('/signin', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  if (!body.password || !body.email) {
    c.status(411)
    return c.json({ success: false, message: "Required fields missing" });
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(body.password);
    const hashBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const user = await prisma.user.findFirst({
      where: {
        email: body.email
      }
    });
    if(!user){
      c.status(400)
      return c.json({ success: false, message: "Account not found" });
    }
    if(user.password !== hashedPassword){
      c.status(400)
      return c.json({ success: false, message: "Invalid Login credentials!" });
    }
    const jwt = await sign({ id: user.user_id, email: user.email }, c.env.JWT_SECRET);
      return c.json({ success: true, data:{token: jwt}, message: 'User logged in successfully!' });
  } catch (e) {
    c.status(500);
    return c.json({ success: false, message: "error while login" }); 
  }
})