import { model, Schema } from 'mongoose'

const courseSchema = new Schema({
    title :{
        type : String,
        required: [true, 'title is required'],
        minLength:[8, 'title must be 8 characters'],
        maxLength:[50, 'title should be less then 50 characters'],
        trim:true
    },
    description : {
        type : String,
        required: [true, 'description is required'],
        minLength:[8, 'description must be 8 characters'],
        maxLength:[50, 'description should be less then 50 characters']
    },
    category : {
        type : String,
        required: [true, 'category is required'],
    },

    thumbnail : {
        public_id : {
            type : String,
            required: true
        },
        secure_url : {
            type : String,
            required: true
        }
    },

    lectures :[
        {
            title : String,
            description:String,
            lecture : {
                public_id : {
                    type : String
                },
                secure_url : {
                    type : String
                }
            }
        }
    ],

    numberOfLectures : {
        type : Number,
        default: 0
    },
    createdBy : {
        type : String,
        required : [true, 'Creater name is required']
    }
},{timestamps:true})

const Course = model("Course",courseSchema)

export default Course