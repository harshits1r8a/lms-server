import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js"
import cloudinary from "cloudinary"
import fs from 'fs/promises'

const getAllCourses = async (req, res, next) => {
    try {
        const course = await Course.find({}).select('-lectures')

        res.status(200).json({
            success: true,
            message: "All course",
            course
        })
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}
const getLecturesByCourseId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        res.status(200).json({
            success: true,
            message: "Course lectures are successfully fetch!",
            lectures: course.lectures
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}

const createCourse = async (req, res, next) => {
    try {
        const { title, description, category, createdBy } = req.body

        if (!title || !description || !category || !createdBy) {
            return next(new AppError("Alll feilds are required!"), 400)
        }


        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: 'Dummy',
                secure_url: 'Dummy',
            },
        })

        if (!course) {
            return next(new AppError('Course not created, please try again!', 500))
        }

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms'
            })
            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }

            fs.rm(`uploads/${req.file.filename}`)
        }

        await course.save()

        res.status(200).json({
            success: true,
            message: 'Course created successfully',
            course
        })

    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}

const updateCourse = async (req, res, next) => { }

const removeCourse = async (req, res, next) => { }

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse
}