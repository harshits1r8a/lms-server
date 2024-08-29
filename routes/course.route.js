import { Router } from 'express'
import { getAllCourses, getLecturesByCourseId, createCourse, updateCourse, removeCourse } from '../controllers/course.controller.js'
import { isLoggedIn } from '../middlewares/auth.middleware.js'
import upload from '../middlewares/multer.middleware.js'

const router = Router()

router.get('/', getAllCourses)
router.get('/:id',isLoggedIn, getLecturesByCourseId)

router.post('/create',isLoggedIn, upload.single('thumbnail'), createCourse)

export default router