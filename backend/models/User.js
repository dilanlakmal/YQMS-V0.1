import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    emp_id: String,
    emp_code: String,
    eng_name: String,
    kh_name: String,
    name: String,
    email: String,
    password: String,
    roles: [String],
    sub_roles: [String],
    job_title: String,
    sup_code: String,
    working_status: String,
    dept_name: String,
    sect_name: String,
    profile: String,
    device_token: Object,
    remember_token: String,
    face_id: String,
    created_at: Date,
    updated_at: Date,
  });
  
  const User = mongoose.model("User", userSchema);

  export default User;
  