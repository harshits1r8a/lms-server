import mongoose from 'mongoose'

mongoose.set('strictQuery', false)

const connectionToDB = async ()=>{
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`)
        if(conn) console.log(`Connection stablished with MongoDB : ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
} 

export default connectionToDB

