import bcrypt from "bcrypt";

export default function setupUserRoutes(app, { UserMain, RoleManagment }) {

  // GET /api/search-users
  app.get("/api/search-users", async (req, res) => {
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
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // GET /api/user-details
  app.get("/api/user-details", async (req, res) => {
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
  });

  // GET /api/job-titles
  app.get("/api/job-titles", async (req, res) => {
    try {
      const jobTitles = await UserMain.distinct("job_title", {
        working_status: "Working",
      });
      res.json(jobTitles.filter((title) => title));
    } catch (error) {
      console.error("Error fetching job titles:", error);
      res.status(500).json({ message: "Failed to fetch job titles" });
    }
  });

  // GET /api/users-by-job-title
  app.get("/api/users-by-job-title", async (req, res) => {
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
  });

  // POST /api/role-management
  app.post("/api/role-management", async (req, res) => {
    try {
      const { role, jobTitles } = req.body;

      const users = await UserMain.find(
        {
          job_title: { $in: jobTitles },
          working_status: "Working",
        },
        "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
      );

      let roleDoc = await RoleManagment.findOne({ role });

      if (roleDoc) {
        roleDoc.jobTitles = jobTitles;
        roleDoc.users = users.map((user) => ({
          emp_id: user.emp_id,
          name: user.name,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
          working_status: user.working_status,
          phone_number: user.phone_number,
          face_photo: user.face_photo,
        }));
      } else {
        roleDoc = new RoleManagment({
          role,
          jobTitles,
          users: users.map((user) => ({
            emp_id: user.emp_id,
            name: user.name,
            eng_name: user.eng_name,
            kh_name: user.kh_name,
            job_title: user.job_title,
            dept_name: user.dept_name,
            sect_name: user.sect_name,
            working_status: user.working_status,
            phone_number: user.phone_number,
            face_photo: user.face_photo,
          })),
        });
      }

      await roleDoc.save();
      res.json({ message: `Role ${roleDoc ? "updated" : "added"} successfully` });
    } catch (error) {
      console.error("Error saving role:", error);
      res.status(500).json({ message: "Failed to save role" });
    }
  });

  // GET /api/user-roles/:empId
  app.get("/api/user-roles/:empId", async (req, res) => {
    try {
      const { empId } = req.params;
      const roles = [];

      // Find all roles where this user exists
      const userRoles = await RoleManagment.find({
        "users.emp_id": empId,
      });

      userRoles.forEach((role) => {
        if (!["Super Admin", "Admin"].includes(role.role)) {
          roles.push(role.role);
        }
      });

      res.json({ roles });
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  // GET /api/role-management
  app.get("/api/role-management", async (req, res) => {
    try {
      const roles = await RoleManagment.find({}).sort({
        role: 1, // Sort by role name
      });
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // GET /api/role-management (Duplicate endpoint, keep one)
  // app.get("/api/role-management", async (req, res) => {
  //   try {
  //     const roles = await RoleManagment.find({});
  //     res.json(roles);
  //   } catch (error) {
  //     console.error("Error fetching roles:", error);
  //     res.status(500).json({ message: "Failed to fetch roles" });
  //   }
  // });

  // POST /api/role-management/super-admin
  app.post("/api/role-management/super-admin", async (req, res) => {
    try {
      const { user } = req.body;

      let superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

      if (!superAdminRole) {
        superAdminRole = new RoleManagment({
          role: "Super Admin",
          jobTitles: ["Developer"],
          users: [],
        });
      }

      const userExists = superAdminRole.users.some(
        (u) => u.emp_id === user.emp_id
      );

      if (userExists) {
        return res.status(400).json({ message: "User is already a Super Admin" });
      }

      const userDetails = await UserMain.findOne(
        { emp_id: user.emp_id },
        "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
      );

      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }

      superAdminRole.users.push({
        emp_id: userDetails.emp_id,
        name: userDetails.name,
        eng_name: userDetails.eng_name,
        kh_name: userDetails.kh_name,
        job_title: "Developer",
        dept_name: userDetails.dept_name,
        sect_name: userDetails.sect_name,
        working_status: userDetails.working_status,
        phone_number: userDetails.phone_number,
        face_photo: userDetails.face_photo,
      });

      await superAdminRole.save();
      res.json({ message: "Super Admin registered successfully" });
    } catch (error) {
      console.error("Error registering super admin:", error);
      res.status(500).json({ message: "Failed to register super admin" });
    }
  });

  // Delete Super Admin endpoint
  app.delete("/api/role-management/super-admin/:empId", async (req, res) => {
    try {
      const { empId } = req.params;

      // Find the Super Admin role
      const superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

      if (!superAdminRole) {
        return res.status(404).json({ message: "Super Admin role not found" });
      }

      // Check if the employee ID is in the protected list
      const protectedEmpIds = ["YM6702", "YM7903"]; // Define protected IDs here or import from config
      if (protectedEmpIds.includes(empId)) {
        return res.status(403).json({
          message: "Cannot delete protected Super Admin users",
        });
      }

      // Find the user index in the users array
      const userIndex = superAdminRole.users.findIndex(
        (user) => user.emp_id === empId
      );

      if (userIndex === -1) {
        return res.status(404).json({
          message: "User not found in Super Admin role",
        });
      }

      // Remove the user from the array using MongoDB update
      const result = await RoleManagment.updateOne(
        { role: "Super Admin" },
        {
          $pull: {
            users: { emp_id: empId },
          },
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({
          message: "Failed to remove Super Admin",
        });
      }

      // Fetch the updated document
      const updatedRole = await RoleManagment.findOne({ role: "Super Admin" });

      res.json({
        message: "Super Admin removed successfully",
        updatedRole: updatedRole,
      });
    } catch (error) {
      console.error("Error removing super admin:", error);
      res.status(500).json({ message: "Failed to remove super admin" });
    }
  });

  // GET /api/users - Fetch all users (used by UserList)
  app.get('/users', async (req, res) => {
    try {
      const users = await UserMain.find();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // POST /users - Create an External User / Device (used by createUser)
  app.post("/users", async (req, res) => {
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
        working_status, // Optional, but will default to "Working"
        password,
      } = req.body;

      // Check if a user with the same name already exists (case-insensitive)
      const existingUserByName = await UserMain.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      if (existingUserByName) {
        return res.status(400).json({
          message: "User already exist! Please Use different Name",
        });
      }

      // If emp_id is provided, check if it already exists
      if (emp_id) {
        const existingUser = await UserMain.findOne({ emp_id });
        if (existingUser) {
          return res.status(400).json({
            message: "Employee ID already exists. Please use a different ID.",
          });
        }
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new user with the provided fields.
      const newUser = new UserMain({
        emp_id,
        name,
        email,
        job_title: job_title || "External", // Default job title
        eng_name,
        kh_name,
        phone_number,
        dept_name,
        sect_name,
        working_status: working_status || "Working", // Default status
        password: hashedPassword,
      });

      // Save the user to the database
      await newUser.save();

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // PUT /users/:id - Update a user (used by editUser)
  app.put('/users/:id', async (req, res) => {
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
  });

  // DELETE /users/:id - Delete a user (used by deleteUser)
  app.delete("/users/:id", async (req, res) => {
    try {
      await UserMain.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // GET /api/users-paginated
  app.get("/api/users-paginated", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const jobTitle = req.query.jobTitle || ""; // Optional jobTitle filter
      const empId = req.query.empId || ""; // Optional empId filter
      const section = req.query.section || ""; // Optional section filter

      // Build the query object
      const query = {};
      if (jobTitle) {
        query.job_title = jobTitle;
      }
      if (empId) {
        query.emp_id = empId;
      }
      if (section) {
        query.sect_name = section;
      }
      query.working_status = "Working"; // Ensure only working users are fetched

      // Fetch users with pagination and filters
      const users = await UserMain.find(query)
        .skip(skip)
        .limit(limit)
        .select("emp_id eng_name kh_name dept_name sect_name job_title")
        .exec();

      // Get total count for pagination (with filters applied)
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
  });

  // GET /api/sections
  app.get("/api/sections", async (req, res) => {
    try {
      const sections = await UserMain.distinct("sect_name", {
        working_status: "Working",
      });
      res.json(sections.filter((section) => section)); // Filter out null/empty values
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // GET /api/user-by-emp-id (used by RovingReport)
  app.get("/api/user-by-emp-id", async (req, res) => {
    try {
      const empId = req.query.emp_id;
      if (!empId) {
        return res.status(400).json({ error: "emp_id is required" });
      }

      const user = await UserMain.findOne({ emp_id: empId }).exec(); // Use UserMain
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
  });

  // GET /api/qc2-inspection-pass-bundle/filter-options (used by LiveDashboard)
  app.get("/api/qc2-inspection-pass-bundle/filter-options", async (req, res) => {
    try {
      const filterOptions = await QC2InspectionPassBundle.aggregate([
        {
          $group: {
            _id: null,
            moNo: { $addToSet: "$moNo" },
            color: { $addToSet: "$color" },
            size: { $addToSet: "$size" },
            department: { $addToSet: "$department" },
            emp_id_inspection: { $addToSet: "$emp_id_inspection" },
            buyer: { $addToSet: "$buyer" },
            package_no: { $addToSet: "$package_no" }, // Added package_no
            lineNo: { $addToSet: "$lineNo" } // Add Line No
          }
        },
        {
          $project: {
            _id: 0,
            moNo: 1,
            color: 1,
            size: 1,
            department: 1,
            emp_id_inspection: 1,
            buyer: 1,
            package_no: 1,
            lineNo: 1 // Include Line No
          }
        }
      ]);

      const result =
        filterOptions.length > 0
          ? filterOptions[0]
          : {
              moNo: [],
              color: [],
              size: [],
              department: [],
              emp_id_inspection: [],
              buyer: [],
              package_no: [],
              lineNo: [] // Include Line No
            };

      Object.keys(result).forEach((key) => {
        result[key] = result[key]
          .filter(Boolean)
          .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // GET /api/cutting-inspections/qc-inspectors (used by CuttingReport)
  app.get("/api/cutting-inspections/qc-inspectors", async (req, res) => {
    try {
      const inspectors = await CuttingInspection.aggregate([
        {
          $group: {
            _id: "$cutting_emp_id",
            engName: { $first: "$cutting_emp_engName" },
            khName: { $first: "$cutting_emp_khName" }
          }
        },
        {
          $project: {
            _id: 0,
            emp_id: "$_id",
            eng_name: "$engName",
            kh_name: "$khName"
          }
        },
        { $sort: { emp_id: 1 } }
      ]);
      res.json(inspectors);
    } catch (error) {
      console.error(
        "Error fetching QC inspectors from cutting inspections:",
        error
      );
      res
        .status(500)
        .json({ message: "Failed to fetch QC inspectors", error: error.message });
    }
  });

  // GET /api/qc-inline-roving-qc-ids (used by RovingReport)
  app.get("/api/qc-inline-roving-qc-ids", async (req, res) => {
    try {
      const qcIds = await QCInlineRoving.distinct("emp_id");
      res.json(qcIds.filter((id) => id)); // Filter out null/empty values
    } catch (error) {
      console.error("Error fetching QC IDs:", error);
      res.status(500).json({ message: "Failed to fetch QC IDs" });
    }
  });

  // GET /api/filter-options (used by DigitalMeasurement)
  app.get("/api/filter-options", async (req, res) => {
    try {
      const { factory, mono, custStyle, buyer, mode, country, origin, stage } =
        req.query;
      const orderFilter = {};
      if (factory) orderFilter.Factory = factory;
      if (mono) orderFilter.Order_No = mono;
      if (custStyle) orderFilter.CustStyle = custStyle;
      if (buyer) orderFilter.ShortName = buyer;
      if (mode) orderFilter.Mode = mode;
      if (country) orderFilter.Country = country;
      if (origin) orderFilter.Origin = origin;

      const factories = await UserMain.db // Assuming UserMain is connected to ym_eco_board
        .collection("dt_orders")
        .distinct("Factory", orderFilter);
      const monos = await UserMain.db
        .collection("dt_orders")
        .distinct("Order_No", orderFilter);
      const custStyles = await UserMain.db
        .collection("dt_orders")
        .distinct("CustStyle", orderFilter);
      const buyers = await UserMain.db
        .collection("dt_orders")
        .distinct("ShortName", orderFilter);
      const modes = await UserMain.db
        .collection("dt_orders")
        .distinct("Mode", orderFilter);
      const countries = await UserMain.db
        .collection("dt_orders")
        .distinct("Country", orderFilter);
      const origins = await UserMain.db
        .collection("dt_orders")
        .distinct("Origin", orderFilter);

      // Fetch distinct stages from measurement_data, filtered by dt_orders
      let measurementFilter = {};
      if (mono) {
        const order = await UserMain.db
          .collection("dt_orders")
          .findOne({ Order_No: mono }, { projection: { _id: 1 } });
        if (order) {
          measurementFilter.style_id = order._id.toString();
        }
      } else {
        const filteredOrders = await UserMain.db
          .collection("dt_orders")
          .find(orderFilter, { projection: { _id: 1 } })
          .toArray();
        const orderIds = filteredOrders.map((order) => order._id.toString());
        measurementFilter.style_id = { $in: orderIds };
      }
      if (stage) {
        measurementFilter.stage = stage;
      }

      const stages = await UserMain.db
        .collection("measurement_data")
        .distinct("stage", measurementFilter);

      // Fetch distinct emp_ids from UserMain where working_status is "Working"
      const empIds = await UserMain.distinct("emp_id", {
        working_status: "Working",
        emp_id: { $ne: null } // Ensure emp_id is not null
      });

      // Add minDate and maxDate from measurement_data
      const dateRange = await UserMain.db
        .collection("measurement_data")
        .aggregate([
          {
            $group: {
              _id: null,
              minDate: { $min: "$created_at" },
              maxDate: { $max: "$created_at" }
            }
          }
        ])
        .toArray();
      const minDate = dateRange.length > 0 ? dateRange[0].minDate : null;
      const maxDate = dateRange.length > 0 ? dateRange[0].maxDate : null;

      res.json({
        factories,
        monos,
        custStyles,
        buyers,
        modes,
        countries,
        origins,
        stages, // Added stages
        empIds, // Added empIds
        minDate,
        maxDate
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // GET /api/buyers (used by DefectBuyerStatus)
  app.get("/api/buyers", (req, res) => {
    const buyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"]; // Define your buyer list
    res.json(buyers);
  });

  // GET /api/washing-autocomplete (used by WashingLive)
  app.get("/api/washing-autocomplete", async (req, res) => {
    try {
      const { field, query } = req.query;

      // Validate field
      const validFields = [
        "selectedMono",
        "custStyle",
        "buyer",
        "color",
        "size",
        "emp_id_washing"
      ];
      if (!validFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field" });
      }

      // Build match stage for partial search (optional)
      const match = {};
      if (query) {
        match[field] = { $regex: new RegExp(query.trim(), "i") };
      }

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: `$${field}`
          }
        },
        {
          $project: {
            _id: 0,
            value: "$_id"
          }
        },
        { $sort: { value: 1 } },
        ...(query ? [{ $limit: 10 }] : []) // Limit only when searching
      ];

      const results = await Washing.aggregate(pipeline);
      const suggestions = results.map((item) => item.value).filter(Boolean);

      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // GET /api/ironing-autocomplete (used by IroningLive)
  app.get("/api/ironing-autocomplete", async (req, res) => {
    try {
      const { field, query } = req.query;

      const validFields = [
        "selectedMono",
        "custStyle",
        "buyer",
        "color",
        "size",
        "emp_id_ironing"
      ];
      if (!validFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field" });
      }

      const match = {};
      if (query) {
        match[field] = { $regex: new RegExp(query.trim(), "i") };
      }

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: `$${field}`
          }
        },
        {
          $project: {
            _id: 0,
            value: "$_id"
          }
        },
        { $sort: { value: 1 } },
        ...(query ? [{ $limit: 10 }] : [])
      ];

      const results = await Ironing.aggregate(pipeline);
      const suggestions = results.map((item) => item.value).filter(Boolean);

      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching ironing autocomplete suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // GET /api/opa-autocomplete (used by OPALive)
  app.get("/api/opa-autocomplete", async (req, res) => {
    try {
      const { field, query } = req.query;

      const validFields = [
        "selectedMono",
        "custStyle",
        "buyer",
        "color",
        "size",
        "emp_id_opa"
      ];
      if (!validFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field" });
      }

      const match = {};
      if (query) {
        match[field] = { $regex: new RegExp(query.trim(), "i") };
      }

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: `$${field}`
          }
        },
        {
          $project: {
            _id: 0,
            value: "$_id"
          }
        },
        { $sort: { value: 1 } },
        ...(query ? [{ $limit: 10 }] : [])
      ];

      const results = await OPA.aggregate(pipeline);
      const suggestions = results.map((item) => item.value).filter(Boolean);

      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching OPA autocomplete suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // GET /api/cutting-inspections/mo-numbers (used by Cutting)
  app.get("/api/cutting-inspections/mo-numbers", async (req, res) => {
    try {
      const { search } = req.query;
      const query = search ? { moNo: { $regex: search, $options: "i" } } : {};
      const moNumbers = await CuttingInspection.distinct("moNo", query);
      res.json(moNumbers.sort());
    } catch (error) {
      console.error("Error fetching MO numbers from cutting inspections:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch MO numbers", error: error.message });
    }
  });

  // GET /api/cutting-inspections/table-numbers (used by Cutting)
  app.get("/api/cutting-inspections/table-numbers", async (req, res) => {
    try {
      const { moNo, search } = req.query;
      if (!moNo) {
        return res.status(400).json({ message: "MO Number is required" });
      }
      const query = { moNo };
      if (search) {
        query.tableNo = { $regex: search, $options: "i" };
      }
      const tableNumbers = await CuttingInspection.distinct("tableNo", query);
      res.json(tableNumbers.sort());
    } catch (error) {
      console.error(
        "Error fetching Table numbers from cutting inspections:",
        error
      );
      res
        .status(500)
        .json({ message: "Failed to fetch Table numbers", error: error.message });
    }
  });

  // GET /api/cutting-inspection-details-for-modify (used by CuttingInspectionModify)
  app.get("/api/cutting-inspection-details-for-modify", async (req, res) => {
    try {
      const { moNo, tableNo } = req.query;
      if (!moNo || !tableNo) {
        return res
          .status(400)
          .json({ message: "MO Number and Table Number are required" });
      }
      const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });
      if (!inspectionDoc) {
        return res.status(404).json({ message: "Inspection document not found" });
      }
      res.json(inspectionDoc);
    } catch (error) {
      console.error("Error fetching inspection details for modify:", error);
      res.status(500).json({
        message: "Failed to fetch inspection details",
        error: error.message
      });
    }
  });

  // PUT /api/cutting-inspection-update (used by CuttingInspectionModify)
  app.put("/api/cutting-inspection-update", async (req, res) => {
    try {
      const { moNo, tableNo, updatedFields, updatedInspectionDataItem } =
        req.body;

      if (!moNo || !tableNo) {
        return res.status(400).json({
          message: "MO Number and Table Number are required for update."
        });
      }
      if (
        !updatedInspectionDataItem ||
        !updatedInspectionDataItem.inspectedSize
      ) {
        return res.status(400).json({
          message:
            "Valid 'updatedInspectionDataItem' with 'inspectedSize' is required."
        });
      }

      const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });

      if (!inspectionDoc) {
        return res
          .status(404)
          .json({ message: "Inspection document not found to update." });
      }

      // Update top-level fields if provided
      if (updatedFields) {
        if (updatedFields.totalBundleQty !== undefined)
          inspectionDoc.totalBundleQty = updatedFields.totalBundleQty;
        if (updatedFields.bundleQtyCheck !== undefined)
          inspectionDoc.bundleQtyCheck = updatedFields.bundleQtyCheck;
        if (updatedFields.totalInspectionQty !== undefined)
          inspectionDoc.totalInspectionQty = updatedFields.totalInspectionQty;
        if (updatedFields.cuttingtype !== undefined)
          inspectionDoc.cuttingtype = updatedFields.cuttingtype;
      }

      // Find and update the specific item in inspectionData array
      const itemIndex = inspectionDoc.inspectionData.findIndex(
        (item) => item.inspectedSize === updatedInspectionDataItem.inspectedSize
      );

      if (itemIndex > -1) {
        inspectionDoc.inspectionData[itemIndex] = {
          ...inspectionDoc.inspectionData[itemIndex], // Preserve any fields not sent from client (like _id)
          ...updatedInspectionDataItem, // Apply all changes from client
          updated_at: new Date() // Ensure updated_at is set here
        };
      } else {
        return res.status(400).json({
          message: `Inspection data for size ${updatedInspectionDataItem.inspectedSize} not found in the document. Cannot update.`
        });
      }

      inspectionDoc.updated_at = new Date(); // Update top-level document timestamp
      inspectionDoc.markModified("inspectionData"); // Important for nested array updates

      await inspectionDoc.save();

      res.status(200).json({
        message: "Cutting inspection data updated successfully.",
        data: inspectionDoc
      });
    } catch (error) {
      console.error("Error updating cutting inspection data:", error);
      res.status(500).json({
        message: "Failed to update cutting inspection data",
        error: error.message
      });
    }
  });

  // GET /api/cutting-inspections-report (used by CuttingReportQCView)
  app.get("/api/cutting-inspections-report", async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        moNo,
        tableNo,
        qcId, // cutting_emp_id
        page = 1,
        limit = 15
      } = req.query;

      const match = {};

      if (moNo) match.moNo = { $regex: moNo, $options: "i" };
      if (tableNo) match.tableNo = { $regex: tableNo, $options: "i" };
      if (qcId) match.cutting_emp_id = qcId;

      // Date filtering
      if (startDate || endDate) {
        match.$expr = match.$expr || {};
        match.$expr.$and = match.$expr.$and || [];
        if (startDate) {
          const normalizedStartDate = normalizeDateString(startDate);
          match.$expr.$and.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0), // Handle parsing errors
                  onNull: new Date(0) // Handle null dates
                }
              },
              {
                $dateFromString: {
                  dateString: normalizedStartDate,
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              }
            ]
          });
        }
        if (endDate) {
          const normalizedEndDate = normalizeDateString(endDate);
          match.$expr.$and.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Handle parsing errors
                  onNull: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Handle null dates
                }
              },
              {
                $dateFromString: {
                  dateString: normalizedEndDate,
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  onNull: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
              }
            ]
          });
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reportsPipeline = [
        { $match: match },
        {
          $addFields: {
            // Convert inspectionDate to Date object for proper sorting
            convertedDate: {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            }
          }
        },
        { $sort: { convertedDate: 1, moNo: 1, tableNo: 1 } }, // Sort by convertedDate
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 1,
            inspectionDate: 1,
            moNo: 1,
            tableNo: 1,
            color: 1,
            garmentType: 1,
            totalBundleQty: 1,
            bundleQtyCheck: 1,
            totalInspectionQty: 1, // Add this line to include totalInspectionQty
            cutting_emp_engName: 1,
            numberOfInspectedSizes: {
              $size: {
                $ifNull: [{ $setUnion: "$inspectionData.inspectedSize" }, []]
              }
            },
            sumTotalPcs: { $sum: "$inspectionData.totalPcsSize" },
            sumTotalPass: { $sum: "$inspectionData.passSize.total" },
            sumTotalReject: { $sum: "$inspectionData.rejectSize.total" },
            sumTotalRejectMeasurement: {
              $sum: "$inspectionData.rejectMeasurementSize.total"
            },
            sumTotalRejectDefects: {
              $sum: {
                $map: {
                  input: "$inspectionData",
                  as: "data",
                  in: { $ifNull: ["$$data.rejectGarmentSize.total", 0] }
                }
              }
            }
          }
        },
        {
          $addFields: {
            overallPassRate: {
              $cond: [
                { $gt: ["$sumTotalPcs", 0] },
                {
                  $multiply: [{ $divide: ["$sumTotalPass", "$sumTotalPcs"] }, 100]
                },
                0
              ]
            }
          }
        }
      ];

      const reports = await CuttingInspection.aggregate(reportsPipeline);

      const totalDocuments = await CuttingInspection.countDocuments(match);

      res.json({
        reports,
        totalPages: Math.ceil(totalDocuments / parseInt(limit)),
        currentPage: parseInt(page),
        totalReports: totalDocuments
      });
    } catch (error) {
      console.error("Error fetching cutting inspection reports:", error);
      res.status(500).json({
        message: "Failed to fetch cutting inspection reports",
        error: error.message
      });
    }
  });

  // GET /api/cutting-inspection-report-detail/:id (used by CuttingReportQCView)
  app.get("/api/cutting-inspection-report-detail/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid report ID format" });
      }
      const report = await CuttingInspection.findById(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching cutting inspection report detail:", error);
      res.status(500).json({
        message: "Failed to fetch report detail",
        error: error.message
      });
    }
  });

  // GET /api/cutting-inspection-detailed-report (used by CuttingReport)
  app.get("/api/cutting-inspection-detailed-report", async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        moNo,
        lotNo,
        buyer,
        color,
        tableNo,
        page = 0,
        limit = 1
      } = req.query;

      let match = {};

      // Date filtering
      if (startDate || endDate) {
        match.$expr = match.$expr || {};
        match.$expr.$and = match.$expr.$and || [];
        if (startDate) {
          const normalizedStartDate = normalizeDateString(startDate);
          match.$expr.$and.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y"
                }
              },
              {
                $dateFromString: {
                  dateString: normalizedStartDate,
                  format: "%m/%d/%Y"
                }
              }
            ]
          });
        }
        if (endDate) {
          const normalizedEndDate = normalizeDateString(endDate);
          match.$expr.$and.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y"
                }
              },
              {
                $dateFromString: {
                  dateString: normalizedEndDate,
                  format: "%m/%d/%Y"
                }
              }
            ]
          });
        }
      }

      // Other filters with case-insensitive regex
      if (moNo) match.moNo = new RegExp(moNo, "i");
      if (lotNo) match.lotNo = new RegExp(lotNo, "i");
      if (buyer) match.buyer = new RegExp(buyer, "i");
      if (color) match.color = new RegExp(color, "i");
      if (tableNo) match.tableNo = new RegExp(tableNo, "i");

      const totalDocs = await CuttingInspection.countDocuments(match);
      const totalPages = Math.ceil(totalDocs / limit);

      const inspections = await CuttingInspection.find(match)
        .skip(page * limit)
        .limit(parseInt(limit))
        .lean();

      // Calculate summary data for each inspection
      inspections.forEach((inspection) => {
        let totalPcs = 0;
        let totalPass = 0;
        let totalReject = 0;
        let totalRejectMeasurement = 0;
        let totalRejectDefects = 0;

        inspection.inspectionData.forEach((data) => {
          totalPcs += data.totalPcs;
          totalPass += data.totalPass;
          totalReject += data.totalReject;
          totalRejectMeasurement += data.totalRejectMeasurement;
          totalRejectDefects += data.totalRejectDefects;
        });

        const passRate =
          totalPcs > 0 ? ((totalPass / totalPcs) * 100).toFixed(2) : "0.00";
        const result = getResult(inspection.bundleQtyCheck, totalReject); // Assuming getResult is defined elsewhere

        inspection.summary = {
          totalPcs,
          totalPass,
          totalReject,
          totalRejectMeasurement,
          totalRejectDefects,
          passRate,
          result
        };
      });

      res.status(200).json({ data: inspections, totalPages });
    } catch (error) {
      console.error("Error fetching detailed cutting inspection report:", error);
      res.status(500).json({
        message: "Failed to fetch detailed report",
        error: error.message
      });
    }
  });

  // GET /api/cutting-inspection-mo-nos (used by CuttingReport)
  app.get("/api/cutting-inspection-mo-nos", async (req, res) => {
    try {
      const moNos = await CuttingInspection.distinct("moNo");
      res.json(moNos.filter((mo) => mo));
    } catch (error) {
      console.error("Error fetching MO Nos:", error);
      res.status(500).json({ message: "Failed to fetch MO Nos" });
    }
  });

  // GET /api/cutting-inspection-filter-options (used by CuttingReport)
  app.get("/api/cutting-inspection-filter-options", async (req, res) => {
    try {
      const { moNo } = req.query;
      let match = {};
      if (moNo) match.moNo = new RegExp(moNo, "i");

      const lotNos = await CuttingInspection.distinct("lotNo", match);
      const buyers = await CuttingInspection.distinct("buyer", match); // Add buyer filter options
      const colors = await CuttingInspection.distinct("color", match);
      const tableNos = await CuttingInspection.distinct("tableNo", match);

      res.json({
        lotNos: lotNos.filter((lot) => lot),
        buyers: buyers.filter((buyer) => buyer), // Return distinct buyers
        colors: colors.filter((color) => color),
        tableNos: tableNos.filter((table) => table)
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  // GET /api/cutting/trend/garment-type (used by CuttingGarmentTypeTrendAnalysis)
  app.get("/api/cutting/trend/garment-type", async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
    const matchConditions = {};
    if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
    if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };

    if (startDate || endDate) {
      matchConditions.$expr = matchConditions.$expr || {};
      matchConditions.$expr.$and = matchConditions.$expr.$and || [];
      if (startDate)
        matchConditions.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y",
                onError: new Date(0)
              }
            },
            {
              $dateFromString: {
                dateString: normalizeDateString(startDate),
                format: "%m/%d/%Y",
                onError: new Date(0)
              }
            }
          ]
        });
      if (endDate)
        matchConditions.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y",
                onError: new Date()
              }
            },
            {
              $dateFromString: {
                dateString: normalizeDateString(endDate),
                format: "%m/%d/%Y",
                onError: new Date()
              }
            }
          ]
        });
    }

    try {
      const data = await CuttingInspection.aggregate([
        { $match: matchConditions },
        // Step 1: Sum inspectionData fields within each document
        {
          $project: {
            garmentType: 1,
            moNo: 1,
            tableNo: 1,
            totalInspectionQty: 1,
            totalBundleQty: 1,
            bundleQtyCheck: 1,
            totalPcsTop: {
              $sum: "$inspectionData.pcsSize.top"
            },
            totalPcsMiddle: {
              $sum: "$inspectionData.pcsSize.middle"
            },
            totalPcsBottom: {
              $sum: "$inspectionData.pcsSize.bottom"
            },
            totalPassTop: {
              $sum: "$inspectionData.passSize.top"
            },
            totalPassMiddle: {
              $sum: "$inspectionData.passSize.middle"
            },
            totalPassBottom: {
              $sum: "$inspectionData.passSize.bottom"
            },
            totalRejectTop: {
              $sum: "$inspectionData.rejectSize.top"
            },
            totalRejectMiddle: {
              $sum: "$inspectionData.rejectSize.middle"
            },
            totalRejectBottom: {
              $sum: "$inspectionData.rejectSize.bottom"
            },
            totalRejectMeasTop: {
              $sum: "$inspectionData.rejectMeasurementSize.top"
            },
            totalRejectMeasMiddle: {
              $sum: "$inspectionData.rejectMeasurementSize.middle"
            },
            totalRejectMeasBottom: {
              $sum: "$inspectionData.rejectMeasurementSize.bottom"
            },
            totalRejectGarmentTop: {
              $sum: "$inspectionData.rejectGarmentSize.top"
            },
            totalRejectGarmentMiddle: {
              $sum: "$inspectionData.rejectGarmentSize.middle"
            },
            totalRejectGarmentBottom: {
              $sum: "$inspectionData.rejectGarmentSize.bottom"
            },
            totalPcsAll: {
              $sum: "$inspectionData.totalPcsSize"
            },
            sumTotalReject: {
              $sum: "$inspectionData.rejectSize.total"
            }
          }
        },
        // Step 2: Group by garmentType, collecting AQL data per record
        {
          $group: {
            _id: "$garmentType",
            noOfInspections: {
              $addToSet: { moNo: "$moNo", tableNo: "$tableNo" }
            },
            totalBundleQty: { $sum: "$totalBundleQty" },
            bundleQtyCheck: { $sum: "$bundleQtyCheck" },
            totalInspectedQty: { $sum: "$totalPcsAll" },
            sumTotalPcsTop: { $sum: "$totalPcsTop" },
            sumTotalPcsMiddle: { $sum: "$totalPcsMiddle" },
            sumTotalPcsBottom: { $sum: "$totalPcsBottom" },
            sumTotalPassTop: { $sum: "$totalPassTop" },
            sumTotalPassMiddle: { $sum: "$totalPassMiddle" },
            sumTotalPassBottom: { $sum: "$totalPassBottom" },
            sumTotalRejectTop: { $sum: "$totalRejectTop" },
            sumTotalRejectMiddle: { $sum: "$totalRejectMiddle" },
            sumTotalRejectBottom: { $sum: "$totalRejectBottom" },
            sumTotalRejectMeasTop: { $sum: "$totalRejectMeasTop" },
            sumTotalRejectMeasMiddle: { $sum: "$totalRejectMeasMiddle" },
            sumTotalRejectMeasBottom: { $sum: "$totalRejectMeasBottom" },
            sumTotalRejectGarmentTop: { $sum: "$totalRejectGarmentTop" },
            sumTotalRejectGarmentMiddle: { $sum: "$totalRejectGarmentMiddle" },
            sumTotalRejectGarmentBottom: { $sum: "$totalRejectGarmentBottom" },
            aqlRelevantData: {
              $push: {
                totalInspectionQty: "$totalInspectionQty",
                sumTotalReject: "$sumTotalReject",
                totalPcsAll: "$totalPcsAll"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            garmentType: "$_id",
            noOfInspections: { $size: "$noOfInspections" },
            totalBundleQty: 1,
            bundleQtyCheck: 1,
            totalInspectedQty: 1,
            totalPcs: {
              top: "$sumTotalPcsTop",
              middle: "$sumTotalPcsMiddle",
              bottom: "$sumTotalPcsBottom"
            },
            totalPass: {
              top: "$sumTotalPassTop",
              middle: "$sumTotalPassMiddle",
              bottom: "$sumTotalPassBottom"
            },
            totalReject: {
              top: "$sumTotalRejectTop",
              middle: "$sumTotalRejectMiddle",
              bottom: "$sumTotalRejectBottom"
            },
            totalRejectMeasurements: {
              top: "$sumTotalRejectMeasTop",
              middle: "$sumTotalRejectMeasMiddle",
              bottom: "$sumTotalRejectMeasBottom"
            },
            totalRejectDefects: {
              top: "$sumTotalRejectGarmentTop",
              middle: "$sumTotalRejectGarmentMiddle",
              bottom: "$sumTotalRejectGarmentBottom"
            },
            aqlRelevantData: 1
          }
        },
        { $sort: { garmentType: 1 } }
      ]);

      const getAQLResultStatusServer = (
        totalInspectionQty,
        sumTotalReject,
        totalPcsAll
      ) => {
        if (!totalInspectionQty || totalPcsAll < totalInspectionQty) {
          return { key: "pending" };
        }
        if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
          return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
          return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
          return sumTotalReject > 1 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
          return sumTotalReject > 2 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
          return sumTotalReject > 3 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
          return sumTotalReject > 5 ? { key: "reject" } : { key: "pass" };
        }
        if (totalInspectionQty >= 315) {
          return sumTotalReject > 7 ? { key: "reject" } : { key: "pass" };
        }
        return { key: "pending" };
      };

      const processedData = data.map((item) => {
        let aqlPass = 0,
          aqlReject = 0,
          aqlPending = 0;
        item.aqlRelevantData.forEach((aqlItem) => {
          const status = getAQLResultStatusServer(
            aqlItem.totalInspectionQty,
            aqlItem.sumTotalReject,
            aqlItem.totalPcsAll
          );
          if (status.key === "pass") aqlPass++;
          else if (status.key === "reject") aqlReject++;
          else aqlPending++;
        });

        const totalPcsOverall =
          (item.totalPcs.top || 0) +
          (item.totalPcs.middle || 0) +
          (item.totalPcs.bottom || 0);
        const totalPassOverall =
          (item.totalPass.top || 0) +
          (item.totalPass.middle || 0) +
          (item.totalPass.bottom || 0);

        return {
          ...item,
          passRate: {
            top:
              item.totalPcs.top > 0
                ? ((item.totalPass.top || 0) / item.totalPcs.top) * 100
                : 0,
            middle:
              item.totalPcs.middle > 0
                ? ((item.totalPass.middle || 0) / item.totalPcs.middle) * 100
                : 0,
            bottom:
              item.totalPcs.bottom > 0
                ? ((item.totalPass.bottom || 0) / item.totalPcs.bottom) * 100
                : 0,
            overall:
              totalPcsOverall > 0 ? (totalPassOverall / totalPcsOverall) * 100 : 0
          },
          aqlSummary: { pass: aqlPass, reject: aqlReject, pending: aqlPending }
        };
      });
      res.json(processedData);
    } catch (error) {
      console.error("Garment Type Trend Error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch garment type trend data" });
    }
  });

  // GET /api/cutting/filter-options/mo-numbers (used by CuttingGarmentTypeTrendAnalysis)
  app.get("/api/cutting/filter-options/mo-numbers", async (req, res) => {
    try {
      const { search, startDate, endDate, tableNo, buyer } = req.query;
      const match = {};
      if (search) match.moNo = { $regex: search, $options: "i" };
      if (tableNo) match.tableNo = { $regex: tableNo, $options: "i" };
      if (buyer) match.buyer = { $regex: buyer, $options: "i" };
      if (startDate || endDate) {
        match.$expr = match.$expr || {};
        match.$expr.$and = match.$expr.$and || [];
        if (startDate)
          match.$expr.$and.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(startDate),
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              }
            ]
          });
        if (endDate)
          match.$expr.$and.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(endDate),
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              }
            ]
          });
      }
      const moNumbers = await CuttingInspection.distinct("moNo", match);
      res.json(moNumbers.sort());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch MO numbers for filter" });
    }
  });

  // GET /api/cutting/filter-options/table-numbers (used by CuttingGarmentTypeTrendAnalysis)
  app.get("/api/cutting/filter-options/table-numbers", async (req, res) => {
    try {
      const { search, startDate, endDate, moNo, buyer } = req.query;
      const match = {};
      if (moNo) match.moNo = moNo; // Exact match for MO if provided
      else if (search && !moNo)
        match.tableNo = { $regex: search, $options: "i" }; // Search if no MO
      else if (search && moNo) match.tableNo = { $regex: search, $options: "i" };

      if (buyer) match.buyer = { $regex: buyer, $options: "i" };
      if (startDate || endDate) {
        /* ... date filter logic ... */
      }
      const tableNumbers = await CuttingInspection.distinct("tableNo", match);
      res.json(tableNumbers.sort());
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch Table numbers for filter" });
    }
  });

  // GET /api/cutting/filter-options/buyers (used by CuttingGarmentTypeTrendAnalysis)
  app.get("/api/cutting/filter-options/buyers", async (req, res) => {
    try {
      const { search, startDate, endDate, moNo, tableNo } = req.query;
      const match = {};
      if (search) match.buyer = { $regex: search, $options: "i" };
      if (moNo) match.moNo = moNo;
      if (tableNo) match.tableNo = tableNo;
      if (startDate || endDate) {
        /* ... date filter logic ... */
      }
      const buyers = await CuttingInspection.distinct("buyer", {
        ...match,
        buyer: { $ne: null, $ne: "" }
      });
      res.json(buyers.sort());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Buyers for filter" });
    }
  });

  // GET /api/cutting/filter-options/garment-types (used by CuttingGarmentTypeTrendAnalysis)
  app.get("/api/cutting/filter-options/garment-types", async (req, res) => {
    try {
      // This can come from CuttingInspection or a master list like CuttingMeasurementPoint
      const garmentTypes = await CuttingInspection.distinct("garmentType", {
        garmentType: { $ne: null, $ne: "" }
      });
      res.json(garmentTypes.sort());
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch Garment Types for filter" });
    }
  });

  // GET /api/cutting/trend/measurement-points (used by CuttingMeasurementTrendAnalysis)
  app.get("/api/cutting/trend/measurement-points", async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
      req.query;
    const matchConditions = {};
    // ... (build matchConditions similar to above, including garmentType and partName if provided) ...
    if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
    if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
    if (garmentType) matchConditions.garmentType = garmentType;
    // For partName, we need to match inside inspectionData.bundleInspectionData.measurementInsepctionData
    // This makes the initial match more complex or requires filtering after unwind.

    if (startDate || endDate) {
      /* ... date filter logic ... */
    }

    try {
      const pipeline = [
        { $match: matchConditions },
        { $unwind: "$inspectionData" },
        { $unwind: "$inspectionData.bundleInspectionData" },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData"
        },
        // Filter by partName if provided
        ...(partName
          ? [
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                    partName
                }
              }
            ]
          : []),
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
        },
        {
          $project: {
            inspectionDate: "$inspectionDate",
            garmentType: "$garmentType",
            partName:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.partName",
            measurementPoint:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
            value:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
            toleranceMin: "$inspectionData.tolerance.min",
            toleranceMax: "$inspectionData.tolerance.max"
          }
        },
        {
          $group: {
            _id: {
              date: "$inspectionDate", // Group by date for columns
              garmentType: "$garmentType",
              partName: "$partName",
              measurementPoint: "$measurementPoint"
            },
            withinTol: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$value", "$toleranceMin"] },
                      { $lte: ["$value", "$toleranceMax"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            outOfTolNeg: {
              $sum: { $cond: [{ $lt: ["$value", "$toleranceMin"] }, 1, 0] }
            },
            outOfTolPos: {
              $sum: { $cond: [{ $gt: ["$value", "$toleranceMax"] }, 1, 0] }
            },
            totalPoints: { $sum: 1 }
          }
        },
        // Further group to structure for the table (rows: GT, PN, MP; cols: Dates)
        {
          $group: {
            _id: {
              garmentType: "$_id.garmentType",
              partName: "$_id.partName",
              measurementPoint: "$_id.measurementPoint"
            },
            dailyData: {
              $push: {
                date: "$_id.date",
                withinTol: "$withinTol",
                outOfTolNeg: "$outOfTolNeg",
                outOfTolPos: "$outOfTolPos",
                passRate: {
                  $cond: [
                    { $gt: ["$totalPoints", 0] },
                    {
                      $multiply: [
                        { $divide: ["$withinTol", "$totalPoints"] },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            garmentType: "$_id.garmentType",
            partName: "$_id.partName",
            measurementPoint: "$_id.measurementPoint",
            dailyData: 1
          }
        },
        { $sort: { garmentType: 1, partName: 1, measurementPoint: 1 } }
      ];

      const result = await CuttingInspection.aggregate(pipeline);

      // Transform data for frontend table (pivot dailyData to columns)
      const dateHeaders = [
        ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
      ].sort();
      const transformedData = result.map((item) => {
        const valuesByDate = {};
        dateHeaders.forEach((header) => {
          const dayData = item.dailyData.find((d) => d.date === header);
          valuesByDate[header] = dayData
            ? {
                withinTol: dayData.withinTol,
                outOfTolNeg: dayData.outOfTolNeg,
                outOfTolPos: dayData.outOfTolPos,
                passRate: dayData.passRate
              }
            : { withinTol: 0, outOfTolNeg: 0, outOfTolPos: 0, passRate: 0 };
        });
        return {
          garmentType: item.garmentType,
          partName: item.partName,
          measurementPoint: item.measurementPoint,
          values: valuesByDate
        };
      });

      res.json({ headers: dateHeaders, data: transformedData });
    } catch (error) {
      console.error("Measurement Points Trend Error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch measurement points trend data" });
    }
  });

  // GET /api/cutting/trend/fabric-defects (used by CuttingFabricDefectTrendAnalysis)
  app.get("/api/cutting/trend/fabric-defects", async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
      req.query;
    const matchConditions = {};
    // ... (build matchConditions) ...
    if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
    if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
    if (garmentType) matchConditions.garmentType = garmentType;
    if (startDate || endDate) {
      /* ... date filter logic ... */
    }

    try {
      const pipeline = [
        { $match: matchConditions },
        { $unwind: "$inspectionData" },
        { $unwind: "$inspectionData.bundleInspectionData" },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData"
        },
        ...(partName
          ? [
              {
                $match: {
                  "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                    partName
                }
              }
            ]
          : []),
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
        },
        {
          $group: {
            _id: {
              date: "$inspectionDate",
              garmentType: "$garmentType",
              partName:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.partName"
            },
            totalRejectGarmentsForDay: {
              $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.totalDefects"
            }, // Sum of totalDefects from pcs level
            totalPcsForDay: { $sum: "$inspectionData.totalPcsSize" } // This needs to be totalPcs relevant to the part/day
          }
        },
        // Group again to structure for the table
        {
          $group: {
            _id: {
              garmentType: "$_id.garmentType",
              partName: "$_id.partName"
            },
            dailyData: {
              $push: {
                date: "$_id.date",
                rejectCount: "$totalRejectGarmentsForDay",
                // This defect rate needs careful consideration of the denominator (totalPcsForDay)
                // The current totalPcsForDay is summed at a higher level.
                // You might need to sum totalPcs from bundle.pcs for the relevant parts.
                defectRate: {
                  $cond: [
                    { $gt: ["$totalPcsForDay", 0] },
                    {
                      $multiply: [
                        {
                          $divide: [
                            "$totalRejectGarmentsForDay",
                            "$totalPcsForDay"
                          ]
                        },
                        100
                      ]
                    },
                    0
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            garmentType: "$_id.garmentType",
            partName: "$_id.partName",
            dailyData: 1
          }
        },
        { $sort: { garmentType: 1, partName: 1 } }
      ];

      const result = await CuttingInspection.aggregate(pipeline);

      const dateHeaders = [
        ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
      ].sort();
      const transformedData = result.map((item) => {
        const valuesByDate = {};
        dateHeaders.forEach((header) => {
          const dayData = item.dailyData.find((d) => d.date === header);
          valuesByDate[header] = dayData
            ? { rejectCount: dayData.rejectCount, defectRate: dayData.defectRate }
            : { rejectCount: 0, defectRate: 0 };
        });
        return {
          garmentType: item.garmentType,
          partName: item.partName,
          values: valuesByDate
        };
      });
      res.json({ headers: dateHeaders, data: transformedData });
    } catch (error) {
      console.error("Fabric Defect Trend Error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch fabric defect trend data" });
    }
  });

  // GET /api/cutting/trend/top-measurement-issues (used by CuttingMeasurementTrendAnalysis)
  app.get("/api/cutting/trend/top-measurement-issues", async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
    const matchConditions = {};
    // ... (build matchConditions) ...
    if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
    if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
    if (startDate || endDate) {
      /* ... date filter logic ... */
    }

    try {
      const data = await CuttingInspection.aggregate([
        { $match: matchConditions },
        { $unwind: "$inspectionData" },
        { $unwind: "$inspectionData.bundleInspectionData" },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
        },
        {
          $group: {
            _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
            passPoints: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                      "Pass"
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            rejectTolNegPoints: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                          "Fail"
                        ]
                      },
                      {
                        $lt: [
                          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                          "$inspectionData.tolerance.min"
                        ]
                      }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            rejectTolPosPoints: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                          "Fail"
                        ]
                      },
                      {
                        $gt: [
                          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                          "$inspectionData.tolerance.max"
                        ]
                      }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            totalPoints: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            measurementPoint: "$_id",
            passPoints: 1,
            rejectTolNegPoints: 1,
            rejectTolPosPoints: 1,
            issuePercentage: {
              $cond: [
                { $gt: ["$totalPoints", 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $add: ["$rejectTolNegPoints", "$rejectTolPosPoints"] },
                        "$totalPoints"
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: { issuePercentage: -1 } },
        { $limit: 10 } // Top 10 issues
      ]);
      res.json(data);
    } catch (error) {
      console.error("Top Measurement Issues Error:", error);
      res.status(500).json({ message: "Failed to fetch top measurement issues" });
    }
  });

  // GET /api/cutting/trend/top-defect-issues (used by CuttingFabricDefectTrendAnalysis)
  app.get("/api/cutting/trend/top-defect-issues", async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
    const matchConditions = {};
    // ... (build matchConditions) ...
    if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
    if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
    if (startDate || endDate) {
      /* ... date filter logic ... */
    }

    try {
      const data = await CuttingInspection.aggregate([
        { $match: matchConditions },
        { $unwind: "$inspectionData" },
        { $unwind: "$inspectionData.bundleInspectionData" },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
        },
        {
          $unwind:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects"
        },
        {
          $group: {
            _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName",
            defectQty: {
              $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
            }
            // To calculate defectRate, we need total pieces inspected where this defect *could* have occurred.
            // This might require summing totalPcsSize from inspectionData at a higher level or making an assumption.
            // For now, we'll pass total pieces inspected across all relevant documents for a rough rate.
            // A more accurate rate would be specific to parts where this defect applies.
          }
        },
        // Second group stage to get total pieces inspected across all filtered documents
        // This is a simplification for the defect rate denominator.
        {
          $lookup: {
            from: "cuttinginspections", // Self-lookup to get total pieces from all matching documents
            pipeline: [
              { $match: matchConditions },
              { $unwind: "$inspectionData" },
              {
                $group: {
                  _id: null,
                  totalInspectedPieces: { $sum: "$inspectionData.totalPcsSize" }
                }
              }
            ],
            as: "total_inspected_info"
          }
        },
        {
          $unwind: {
            path: "$total_inspected_info",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            defectName: "$_id",
            // defectNameKhmer:  // Would need to join with CuttingFabricDefect model or pass master list
            // defectNameChinese: // Same as above
            defectQty: 1,
            defectRate: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$defectQty", 0] },
                    { $gt: ["$total_inspected_info.totalInspectedPieces", 0] }
                  ]
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        "$defectQty",
                        "$total_inspected_info.totalInspectedPieces"
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: { defectRate: -1 } }, // Or defectQty: -1
        { $limit: 10 } // Top 10 defects
      ]);
      res.json(data);
    } catch (error) {
      console.error("Top Defect Issues Error:", error);
      res.status(500).json({ message: "Failed to fetch top defect issues" });
    }
  });

  // GET /api/cutting/part-names (used by CuttingMeasurementTrendAnalysis, CuttingFabricDefectTrendAnalysis)
  app.get("/api/cutting/part-names", async (req, res) => {
    try {
      const { garmentType } = req.query;
      const match = {};
      if (garmentType) match.panel = garmentType; // Assuming 'panel' field in CuttingMeasurementPoint stores garmentType

      // Fetch unique panelIndexName for the given garmentType (panel)
      const partNamesData = await CuttingMeasurementPoint.aggregate([
        { $match: match },
        { $group: { _id: "$panelIndexName" } },
        { $project: { _id: 0, partName: "$_id" } },
        { $sort: { partName: 1 } }
      ]);
      res.json(partNamesData.map((p) => p.partName));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Part Names" });
    }
  });

  // GET /api/cutting-measurement-panels (used by CuttingMeasurementPointsModify, Cutting)
  app.get("/api/cutting-measurement-panels", async (req, res) => {
    try {
      const panels = await CuttingMeasurementPoint.aggregate([
        {
          $group: {
            _id: "$panel",
            panelKhmer: { $first: "$panelKhmer" },
            panelChinese: { $first: "$panelChinese" }
          }
        },
        {
          $project: {
            panel: "$_id",
            panelKhmer: 1,
            panelChinese: 1,
            _id: 0
          }
        },
        { $sort: { panel: 1 } }
      ]).exec();
      res.status(200).json(panels);
    } catch (error) {
      console.error("Error fetching panels:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch panels", error: error.message });
    }
  });

  // GET /api/cutting-measurement-panel-index-names (used by CuttingMeasurementPointsModify)
  app.get("/api/cutting-measurement-panel-index-names", async (req, res) => {
    try {
      const { panel } = req.query;
      if (!panel) {
        return res.status(400).json({ message: "Panel is required" });
      }
      const panelIndexData = await CuttingMeasurementPoint.aggregate([
        { $match: { panel } },
        {
          $group: {
            _id: "$panelIndexName",
            panelIndex: { $max: "$panelIndex" },
            panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
            panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
          }
        },
        {
          $project: {
            panelIndexName: "$_id",
            panelIndex: 1,
            panelIndexNameKhmer: 1,
            panelIndexNameChinese: 1,
            _id: 0
          }
        },
        { $sort: { panelIndexName: 1 } }
      ]).exec();
      res.status(200).json(panelIndexData);
    } catch (error) {
      console.error("Error fetching panel index names:", error);
      res.status(500).json({
        message: "Failed to fetch panel index names",
        error: error.message
      });
    }
  });

  // GET /api/cutting-measurement-max-panel-index (used by CuttingMeasurementPointsModify)
  app.get("/api/cutting-measurement-max-panel-index", async (req, res) => {
    try {
      const { panel } = req.query;
      if (!panel) {
        return res.status(400).json({ message: "Panel is required" });
      }
      const maxPanelIndexDoc = await CuttingMeasurementPoint.findOne({
        panel
      })
        .sort({ panelIndex: -1 })
        .select("panelIndex");
      const maxPanelIndex = maxPanelIndexDoc ? maxPanelIndexDoc.panelIndex : 0;
      res.status(200).json({ maxPanelIndex });
    } catch (error) {
      console.error("Error fetching max panel index:", error);
      res.status(500).json({
        message: "Failed to fetch max panel index",
        error: error.message
      });
    }
  });

  // POST /api/save-measurement-point (used by CuttingMeasurementPointsModify)
  app.post("/api/save-measurement-point", async (req, res) => {
    try {
      const measurementPoint = req.body;
      // Find the maximum 'no' in the collection
      const maxNo = await CuttingMeasurementPoint.findOne()
        .sort({ no: -1 })
        .select("no");
      const newNo = maxNo ? maxNo.no + 1 : 1;
      // Create new document
      const newDoc = new CuttingMeasurementPoint({
        ...measurementPoint,
        no: newNo
      });
      await newDoc.save();
      res.status(200).json({ message: "Measurement point saved successfully" });
    } catch (error) {
      console.error("Error saving measurement point:", error);
      res.status(500).json({
        message: "Failed to save measurement point",
        error: error.message
      });
    }
  });

  // GET /api/cutting-measurement-mo-numbers (used by CuttingMeasurementPointsModify)
  app.get("/api/cutting-measurement-mo-numbers", async (req, res) => {
    try {
      const searchTerm = req.query.search;
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      const regexPattern = new RegExp(searchTerm, "i");

      const results = await CuttingMeasurementPoint.find({
        moNo: { $regex: regexPattern }
      })
        .select("moNo")
        .limit(100)
        .sort({ moNo: 1 })
        .exec();

      const uniqueMONos = [...new Set(results.map((r) => r.moNo))];

      res.json(uniqueMONos);
    } catch (err) {
      console.error(
        "Error fetching MO numbers from CuttingMeasurementPoint:",
        err
      );
      res.status(500).json({
        message: "Failed to fetch MO numbers from CuttingMeasurementPoint",
        error: err.message
      });
    }
  });

  // GET /api/cutting-measurement-points (used by Cutting)
  app.get("/api/cutting-measurement-points", async (req, res) => {
    try {
      const { moNo, panel } = req.query;
      if (!moNo || !panel) {
        return res.status(400).json({ error: "moNo and panel are required" });
      }

      const points = await CuttingMeasurementPoint.find({
        moNo,
        panel
      }).exec();

      res.json(points);
    } catch (error) {
      console.error("Error fetching measurement points:", error);
      res.status(500).json({
        message: "Failed to fetch measurement points",
        error: error.message
      });
    }
  });

  // GET /api/cutting-measurement-panel-index-names-by-mo (used by Cutting)
  app.get(
    "/api/cutting-measurement-panel-index-names-by-mo",
    async (req, res) => {
      try {
        const { moNo, panel } = req.query;
        if (!moNo || !panel) {
          return res.status(400).json({ message: "moNo and panel are required" });
        }

        // Check if the moNo exists in CuttingMeasurementPoint
        const moExists = await CuttingMeasurementPoint.exists({ moNo });

        let panelIndexData = [];

        if (moExists) {
          // Fetch unique panelIndexName for the specific moNo and panel
          const specificMoData = await CuttingMeasurementPoint.aggregate([
            { $match: { moNo, panel } },
            {
              $group: {
                _id: "$panelIndexName",
                panelIndex: { $max: "$panelIndex" },
                panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
              }
            },
            {
              $project: {
                panelIndexName: "$_id",
                panelIndex: 1,
                panelIndexNameKhmer: 1,
                panelIndexNameChinese: 1,
                _id: 0
              }
            }
          ]).exec();

          // Fetch unique panelIndexName for moNo = 'Common' and panel
          const commonData = await CuttingMeasurementPoint.aggregate([
            { $match: { moNo: "Common", panel } },
            {
              $group: {
                _id: "$panelIndexName",
                panelIndex: { $max: "$panelIndex" },
                panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
              }
            },
            {
              $project: {
                panelIndexName: "$_id",
                panelIndex: 1,
                panelIndexNameKhmer: 1,
                panelIndexNameChinese: 1,
                _id: 0
              }
            }
          ]).exec();

          // Combine data, ensuring no duplicates
          const combinedData = [...commonData];
          specificMoData.forEach((specific) => {
            if (
              !combinedData.some(
                (item) => item.panelIndexName === specific.panelIndexName
              )
            ) {
              combinedData.push(specific);
            }
          });

          panelIndexData = combinedData;
        } else {
          // If moNo doesn't exist, fetch only for moNo = 'Common' and panel
          panelIndexData = await CuttingMeasurementPoint.aggregate([
            { $match: { moNo: "Common", panel } },
            {
              $group: {
                _id: "$panelIndexName",
                panelIndex: { $max: "$panelIndex" },
                panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
              }
            },
            {
              $project: {
                panelIndexName: "$_id",
                panelIndex: 1,
                panelIndexNameKhmer: 1,
                panelIndexNameChinese: 1,
                _id: 0
              }
            }
          ]).exec();
        }

        // Sort by panelIndexName
        panelIndexData.sort((a, b) =>
          a.panelIndexName.localeCompare(b.panelIndexName)
        );

        res.status(200).json(panelIndexData);
      } catch (error) {
        console.error("Error fetching panel index names by MO:", error);
        res.status(500).json({
          message: "Failed to fetch panel index names",
          error: error.message
        });
      }
    }
  );

  // PUT /api/update-measurement-point/:id (used by CuttingMeasurementPointsModify)
  app.put("/api/update-measurement-point/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedPoint = await CuttingMeasurementPoint.findByIdAndUpdate(
        id,
        { $set: { ...updateData, updated_at: new Date() } },
        { new: true }
      );

      if (!updatedPoint) {
        return res.status(404).json({ error: "Measurement point not found" });
      }

      res.status(200).json({ message: "Measurement point updated successfully" });
    } catch (error) {
      console.error("Error updating measurement point:", error);
      res.status(500).json({
        message: "Failed to update measurement point",
        error: error.message
      });
    }
  });

  // GET /api/cutting-fabric-defects (used by Cutting)
  app.get("/api/cutting-fabric-defects", async (req, res) => {
    try {
      const defects = await CuttingFabricDefect.find({});
      res.status(200).json(defects);
    } catch (error) {
      console.error("Error fetching cutting fabric defects:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch defects", error: error.message });
    }
  });

  // GET /api/cutting-issues (used by Cutting)
  app.get("/api/cutting-issues", async (req, res) => {
    try {
      const issues = await CuttingIssue.find().sort({ no: 1 });
      res.status(200).json(issues);
    } catch (error) {
      console.error("Error fetching cutting issues:", error);
      res.status(500).json({
        message: "Failed to fetch cutting issues",
        error: error.message
      });
    }
  });

  // Multer configuration for cutting images
  const cutting_storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "..", "public", "storage", "cutting");
      try {
        // Create directory synchronously if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      } catch (error) {
        console.error("Error creating directory:", error);
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      cb(null, `cutting-${Date.now()}${path.extname(file.originalname)}`);
    }
  });

  // File filter for JPEG/PNG only
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"), false);
    }
  };

  const cutting_upload = multer({
    storage: cutting_storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // POST /api/upload-cutting-image (used by CuttingIssues)
  app.post(
    "/api/upload-cutting-image",
    cutting_upload.single("image"),
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const url = `/storage/cutting/${req.file.filename}`;
      res.status(200).json({ url });
    }
  );

  // Helper function to determine AQL result (used by CuttingReportQCView)
  function getResult(bundleQtyCheck, totalReject) {
    if (bundleQtyCheck === 5) return totalReject > 1 ? "Fail" : "Pass";
    if (bundleQtyCheck === 9) return totalReject > 3 ? "Fail" : "Pass";
    if (bundleQtyCheck === 14) return totalReject > 5 ? "Fail" : "Pass";
    if (bundleQtyCheck === 20) return totalReject > 7 ? "Fail" : "Pass";
    return "N/A";
  }

  // Helper function to normalize date strings (used by CuttingReportQCView, CuttingReport, CuttingTrendAnalysis endpoints)
  const normalizeDateString = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      // Fallback for already formatted strings or handle error
      return dateStr;
    }
  };

}