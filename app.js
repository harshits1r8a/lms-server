import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import userRouter from './routes/user.route.js'
import courseRouter from './routes/course.route.js'
import errorMiddleware from './middlewares/error.middleware.js'


const app = express()



// middleware function
app.use(express.json())
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}))
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(morgan('dev'))


// routes
app.use('/ping',(req,res)=>{
    res.send('Pong')
})

app.use('/api/v1/user',userRouter)
app.use('/api/v1/courses',courseRouter)

app.use('*',(req,res)=>{
    res.status(400).send("OOPS! 404 page not found")
})

app.use(errorMiddleware)

export default app