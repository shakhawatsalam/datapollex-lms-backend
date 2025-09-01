import { Document, Types } from "mongoose";

/**
 * Thumbnail Object
 */
export interface IThumbnail {
  public_id: string;
  url: string;
}

/**
 * PDF Note Object
 */
export interface IPdfNote {
  public_id: string;
  url: string;
}

/**
 * Lecture Interface
 */
export interface ILecture {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  pdfNotes: IPdfNote[];
}

/**
 * Module Interface
 */
export interface IModule {
  _id: Types.ObjectId;
  title: string;
  moduleNumber: number;
  lectures: ILecture[];
}

/**
 * Course Interface
 */
export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  thumbnail: IThumbnail;
  modules: IModule[];
}
