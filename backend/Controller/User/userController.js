import bcrypt from "bcrypt";
import {
  UserMain,                
} from "../../Config/mongodb.js"; 

// GET /api/search-user
export const searchUser = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await UserMain.find(
      {
        emp_id: { $regex: q, $options: "i" },
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /api/user-details
export const getUserDetails = async (req, res) => {
  try {
    const { empId } = req.query;
    if (!empId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    const user = await UserMain.findOne(
      { emp_id: empId, working_status: "Working" },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// GET /api/job-titles
export const getJobTitles = async (req, res) => {
  try {
    const jobTitles = await UserMain.distinct("job_title", {
      working_status: "Working",
    });
    res.json(jobTitles.filter((title) => title));
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ message: "Failed to fetch job titles" });
  }
};

// GET /api/users-by-job-title
export const getUsersByJobTitle = async (req, res) => {
  try {
    const { jobTitle } = req.query;
    const users = await UserMain.find(
      {
        job_title: jobTitle,
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by job title:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /users (Note: path is just /users, not /api/users)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserMain.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// POST /users
export const createUser = async (req, res) => {
  try {
    const {
      emp_id,
      name,
      email,
      job_title,
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status,
      password,
    } = req.body;

    const existingUserByName = await UserMain.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingUserByName) {
      return res.status(400).json({
        message: "User already exist! Please Use different Name",
      });
    }

    if (emp_id) {
      const existingUser = await UserMain.findOne({ emp_id });
      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already exists. Please use a different ID.",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserMain({
      emp_id,
      name,
      email,
      job_title: job_title || "External",
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status: working_status || "Working",
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// PUT /users/:id
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await UserMain.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// DELETE /users/:id
export const deleteUser = async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// GET /api/users-paginated
export const getUsersPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const jobTitle = req.query.jobTitle || "";
    const empId = req.query.empId || "";
    const section = req.query.section || "";

    const query = {};
    if (jobTitle) query.job_title = jobTitle;
    if (empId) query.emp_id = empId;
    if (section) query.sect_name = section;
    query.working_status = "Working";

    const users = await UserMain.find(query)
      .skip(skip)
      .limit(limit)
      .select("emp_id eng_name kh_name dept_name sect_name job_title")
      .exec();

    const total = await UserMain.countDocuments(query);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Error fetching paginated users:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message
    });
  }
};

// GET /api/sections
export const getSections = async (req, res) => {
  try {
    const sections = await UserMain.distinct("sect_name", {
      working_status: "Working",
    });
    res.json(sections.filter((section) => section));
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
};

// GET /api/user-by-emp-id
export const getUserByEmpId = async (req, res) => {
  try {
    const empId = req.query.emp_id;
    if (!empId) {
      return res.status(400).json({ error: "emp_id is required" });
    }

    const user = await UserMain.findOne({ emp_id: empId }).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name
    });
  } catch (err) {
    console.error("Error fetching user by emp_id:", err);
    res.status(500).json({
      message: "Failed to fetch user data",
      error: err.message
    });
  }
};

// GET /api/qc2-inspection-pass-bundle/filter-options
// export const getQc2FilterOptions = async (req, res) => {
//   try {
//     const filterOptions = await QC2InspectionPassBundle.aggregate([
//       {
//         $group: {
//           _id: null,
//           moNo: { $addToSet: "$moNo" },
//           color: { $addToSet: "$color" },
//           size: { $addToSet: "$size" },
//           department: { $addToSet: "$department" },
//           emp_id_inspection: { $addToSet: "$emp_id_inspection" },
//           buyer: { $addToSet: "$buyer" },
//           package_no: { $addToSet: "$package_no" },
//           lineNo: { $addToSet: "$lineNo" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: 1,
//           color: 1,
//           size: 1,
//           department: 1,
//           emp_id_inspection: 1,
//           buyer: 1,
//           package_no: 1,
//           lineNo: 1
//         }
//       }
//     ]);

//     const result =
//       filterOptions.length > 0
//         ? filterOptions[0]
//         : {
//             moNo: [],
//             color: [],
//             size: [],
//             department: [],
//             emp_id_inspection: [],
//             buyer: [],
//             package_no: [],
//             lineNo: []
//           };

//     Object.keys(result).forEach((key) => {
//       result[key] = result[key]
//         .filter(Boolean)
//         .sort((a, b) => (key === "package_no" ? a - b : String(a).localeCompare(String(b))));
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching QC2 filter options:", error);
//     res.status(500).json({ error: "Failed to fetch QC2 filter options" });
//   }
// };

// GET /api/qc-inline-roving-qc-ids
// export const getQcInlineRovingQcIds = async (req, res) => {
//   try {
//     const qcIds = await QCInlineRoving.distinct("emp_id");
//     res.json(qcIds.filter((id) => id));
//   } catch (error) {
//     console.error("Error fetching QC Inline Roving QC IDs:", error);
//     res.status(500).json({ message: "Failed to fetch QC IDs" });
//   }
// };

// GET /api/filter-options (DigitalMeasurement)
// export const getDigitalMeasurementFilterOptions = async (req, res) => {
//   try {
//     const { factory, mono, custStyle, buyer, mode, country, origin, stage } = req.query;
//     const orderFilter = {};
//     if (factory) orderFilter.Factory = factory;
//     if (mono) orderFilter.Order_No = mono;
//     if (custStyle) orderFilter.CustStyle = custStyle;
//     if (buyer) orderFilter.ShortName = buyer;
//     if (mode) orderFilter.Mode = mode;
//     if (country) orderFilter.Country = country;
//     if (origin) orderFilter.Origin = origin;

//     const dtOrdersCollection = UserMain.db.collection("dt_orders");
//     const measurementDataCollection = UserMain.db.collection("measurement_data");

//     const factories = await dtOrdersCollection.distinct("Factory", orderFilter);
//     const monos = await dtOrdersCollection.distinct("Order_No", orderFilter);
//     const custStyles = await dtOrdersCollection.distinct("CustStyle", orderFilter);
//     const buyers = await dtOrdersCollection.distinct("ShortName", orderFilter);
//     const modes = await dtOrdersCollection.distinct("Mode", orderFilter);
//     const countries = await dtOrdersCollection.distinct("Country", orderFilter);
//     const origins = await dtOrdersCollection.distinct("Origin", orderFilter);

//     let measurementFilter = {};
//     if (mono) {
//       const order = await dtOrdersCollection.findOne({ Order_No: mono }, { projection: { _id: 1 } });
//       if (order) {
//         measurementFilter.style_id = order._id.toString();
//       } else {
//          // If mono is specified but not found, no stages can be found for it.
//         measurementFilter.style_id = null; // Or some impossible value
//       }
//     } else {
//       const filteredOrders = await dtOrdersCollection.find(orderFilter, { projection: { _id: 1 } }).toArray();
//       const orderIds = filteredOrders.map((order) => order._id.toString());
//       if (orderIds.length > 0) {
//         measurementFilter.style_id = { $in: orderIds };
//       } else if (Object.keys(orderFilter).length > 0) {
//         // If filters were applied but no orders matched, no stages can be found.
//         measurementFilter.style_id = null; // Or some impossible value
//       }
//       // If no order filters, style_id remains unconstrained for stages
//     }
//     if (stage) {
//       measurementFilter.stage = stage;
//     }

//     const stages = measurementFilter.style_id === null ? [] : await measurementDataCollection.distinct("stage", measurementFilter);

//     const empIds = await UserMain.distinct("emp_id", {
//       working_status: "Working",
//       emp_id: { $ne: null }
//     });

//     const dateRange = await measurementDataCollection.aggregate([
//       { $group: { _id: null, minDate: { $min: "$created_at" }, maxDate: { $max: "$created_at" } } }
//     ]).toArray();
//     const minDate = dateRange.length > 0 ? dateRange[0].minDate : null;
//     const maxDate = dateRange.length > 0 ? dateRange[0].maxDate : null;

//     res.json({
//       factories, monos, custStyles, buyers, modes, countries, origins,
//       stages, empIds, minDate, maxDate
//     });
//   } catch (error) {
//     console.error("Error fetching digital measurement filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// };

// GET /api/buyers
// export const getBuyerList = (req, res) => {
//   const buyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
//   res.json(buyers);
// };

// const createAutocompleteHandler = (Model) => async (req, res) => {
//   try {
//     const { field, query } = req.query;
//     const validFields = [
//       "selectedMono", "custStyle", "buyer", "color", "size",
//       "emp_id_washing", "emp_id_ironing", "emp_id_opa" // Combine all possible emp_id fields
//     ];
//     if (!validFields.includes(field)) {
//       return res.status(400).json({ error: "Invalid field for autocomplete" });
//     }

//     const match = {};
//     if (query) {
//       match[field] = { $regex: new RegExp(String(query).trim(), "i") };
//     }

//     const pipeline = [
//       { $match: match },
//       { $group: { _id: `$${field}` } },
//       { $project: { _id: 0, value: "$_id" } },
//       { $sort: { value: 1 } },
//       ...(query ? [{ $limit: 10 }] : [])
//     ];

//     const results = await Model.aggregate(pipeline);
//     const suggestions = results.map((item) => item.value).filter(Boolean);
//     res.json(suggestions);
//   } catch (error) {
//     console.error(`Error fetching ${Model.modelName} autocomplete suggestions:`, error);
//     res.status(500).json({ error: "Failed to fetch suggestions" });
//   }
// };

// GET /api/washing-autocomplete
// export const getWashingAutocomplete = createAutocompleteHandler(Washing);

// GET /api/ironing-autocomplete
// export const getIroningAutocomplete = createAutocompleteHandler(Ironing);

// GET /api/opa-autocomplete
// export const getOpaAutocomplete = createAutocompleteHandler(OPA);