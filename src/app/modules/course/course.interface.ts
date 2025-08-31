import { Document } from "mongoose";

// Thumbnail Object
export interface IThumbnail {
  public_id: string;
  url: string;
}

// PDF Note Object
export interface IPdfNote {
  public_id: string;
  url: string;
}

// Lecture Interface
export interface ILecture {
  title: string;
  videoUrl: string;
  pdfNotes: IPdfNote[];
}

// Module Interface
export interface IModule {
  title: string;
  moduleNumber: number; // Auto-incremented
  lectures: ILecture[];
}

// Course Interface
export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  thumbnail: IThumbnail;
  modules: IModule[];
}
