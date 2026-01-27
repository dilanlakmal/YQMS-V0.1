import mongoose from "mongoose";
import { Schema } from "mongoose";
import Content  from "../translation/content.model.js";
import { Int32 } from "mongoose/lib/schema/index.js";

const progressSchema = new Schema({
  title: {
    type: Schema.Types.ObjectId,
    ref: "content", 
    required: true,

  },
  description: {
    type: Schema.Types.ObjectId,
    ref: "content", 
    required: true,

  },
  icon: String,
  order: Int32,
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User" ,
    required: true
  }
});

progressSchema.statics.createWithText = async function ({
  title,
  description,
  icon,
  status,
  user_id
}) {

  // create content docs
  const titleContent = await Content.createWithText({
    originalText: title,
  });

  const descContent = await Content.createWithText({
    originalText: description,
  });

  // create progress
  return this.create({
    title: titleContent._id,
    description: descContent._id,
    icon,
    status,
    order,
    user_id
  });
};




// static method
progressSchema.statics.getByUserId = async function (userId) {
  const response = await this.find({ user_id: userId })
    .populate({
      path: "title",
      populate: [
        { path: "language", model: "language" },
        { path: "translations", model: "content" }
      ]
    })
    .populate({
      path: "description",
      populate: [
        { path: "language", model: "language" },
        { path: "translations", model: "content" }
      ]
    })
    .exec();
  

  return response.map(res => ({
    id: res._id,
    title: res.title?.original ?? null,
    description: res.description?.original ?? null,
    order: res.order,
    icon: res.icon,
    status: res.status,
    language:
      res.title?.language?.code === res.description?.language?.code
        ? res.title?.language?.code
        : "en"
  }));
};

progressSchema.statics.translateAllContent = async function(userId, toLanguage) {
  const progresses = await this.find({ user_id: userId })
    .populate({
      path: "title",
      populate: [
        { path: "language", model: "language" },
        { path: "translations", model: "content" }
      ]
    })
    .populate({
      path: "description",
      populate: [
        { path: "language", model: "language" },
        { path: "translations", model: "content" }
      ]
    })
    .exec();

  // Loop through each progress and translate its content
  for (const progress of progresses) {
    if (progress.title) await progress.title.translateText(toLanguage);
    if (progress.description) await progress.description.translateText(toLanguage);
  }
  // Map for API response
  return progresses.map(res => ({
    id: res._id,
    title: res.title?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    description: res.description?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    order: res.order,
    icon: res.icon,
    status: res.status,
    language: toLanguage
  }));
};


const Progress = mongoose.model("progress", progressSchema);
export default Progress;
