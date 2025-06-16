import mongoose from "mongoose";

const userSectionStatSchema = new mongoose.Schema({
  emp_id: String,
  eng_name: String,
  kh_name: String,
  job_title: String,
  dept_name: String,
  sect_name: String,
  stats: mongoose.Schema.Types.Mixed, 
  last_updated: Date,
}, { _id: false });

const dailyUserStatSchema = new mongoose.Schema({
  _id: String, 
  date: String, 
  sections: {
    type: Map,
    of: { 
      type: Map,
      of: userSectionStatSchema 
    }
  }
});

export default (connection) => connection.model('DailyUserStat', dailyUserStatSchema);
