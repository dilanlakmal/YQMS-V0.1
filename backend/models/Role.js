import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  sub_roles: [
    {
      value: String,
      name: String,
      types: [
        {
          value: String,
          name: String,
        },
      ],
    },
  ],
});

export default (connection) => connection.model("Role", RoleSchema);
