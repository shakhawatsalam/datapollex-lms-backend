import mongoose, { Schema, Model } from "mongoose";
import { ICourse, ILecture, IModule, IPdfNote, IThumbnail } from "./course.interface";


const thumbnailSchema: Schema<IThumbnail> = new Schema({
  public_id: {
    type: String,
    required: [true, "Thumbnail public ID is required"],
  },
  url: {
    type: String,
    required: [true, "Thumbnail URL is required"],
  },
});

const pdfNoteSchema: Schema<IPdfNote> = new Schema({
  public_id: {
    type: String,
    required: [true, "PDF note public ID is required"],
  },
  url: {
    type: String,
    required: [true, "PDF note URL is required"],
  },
});

const lectureSchema: Schema<ILecture> = new Schema({
  title: {
    type: String,
    required: [true, "Lecture title is required"],
  },
  videoUrl: {
    type: String,
    required: [true, "Lecture video URL is required"],
  },
  pdfNotes: [pdfNoteSchema],
});

const moduleSchema: Schema<IModule> = new Schema({
  title: {
    type: String,
    required: [true, "Module title is required"],
  },
  moduleNumber: {
    type: Number,
    required: [true, "Module number is required"],
  },
  lectures: [lectureSchema],
});

const courseSchema: Schema<ICourse> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Price cannot be negative"],
    },
    thumbnail: {
      type: thumbnailSchema,
      required: [true, "Course thumbnail is required"],
    },
    modules: [moduleSchema],
  },
  { timestamps: true }
);



courseSchema.index({ title: 1 });

courseSchema.index({ "modules.moduleNumber": 1 });

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;
