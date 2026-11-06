/**
 * Homework 2 (Set A): Designing a Mongoose Schema for Course Registration
 * Many-to-Many: Student.courses <-> Course.students
 * Chay: npm install && node homework_many_to_many.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ---- Schemas ----
const studentSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    maxStudents: { type: Number, required: true, min: 1 },
    availableSlots: { type: Number, required: true, min: 0 },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

// ---- 1. Enroll in a course ----
async function enrollCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error(`Student #${studentId} not found`);

  const course = await Course.findById(courseId);
  if (!course) throw new Error(`Course #${courseId} not found`);

  // Check da dang ky chua
  if (student.courses.some((c) => c.equals(course._id))) {
    throw new Error('Student already enrolled in this course');
  }
  // Check con slot khong
  if (course.availableSlots <= 0) {
    throw new Error('Course is full (availableSlots = 0)');
  }

  // Hop le: them 2 chieu + giam slot
  student.courses.push(course._id);
  course.students.push(student._id);
  course.availableSlots -= 1;

  await student.save();
  await course.save();
  console.log(`Enrolled ${student.fullName} -> ${course.title} (slots left: ${course.availableSlots})`);
  return { student, course };
}

// ---- 2. Drop a course ----
async function dropCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error(`Student #${studentId} not found`);

  const course = await Course.findById(courseId);
  if (!course) throw new Error(`Course #${courseId} not found`);

  // Xoa khoi 2 mang
  student.courses.pull(course._id);
  course.students.pull(student._id);
  // Tra lai 1 slot (khong vuot qua maxStudents)
  course.availableSlots = Math.min(course.availableSlots + 1, course.maxStudents);

  await student.save();
  await course.save();
  console.log(`Dropped ${student.fullName} from ${course.title} (slots: ${course.availableSlots})`);
  return { student, course };
}

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/course_registration_db';
  await mongoose.connect(uri);
  console.log('Connected:', uri);

  // Seed demo neu chua co
  let student = await Student.findOne();
  let course = await Course.findOne();
  if (!student) {
    student = await Student.create({ fullName: 'Nguyen Van A', email: 'a@example.com', courses: [] });
  }
  if (!course) {
    course = await Course.create({ title: 'Web Programming', maxStudents: 50, availableSlots: 50, students: [] });
  }
  console.log('Demo student:', student._id.toString(), '| course:', course._id.toString());

  // Vi du chay thu (bo comment de test):
  // await enrollCourse(student._id, course._id);
  // await dropCourse(student._id, course._id);

  await mongoose.disconnect();
}

module.exports = { Student, Course, enrollCourse, dropCourse };

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
