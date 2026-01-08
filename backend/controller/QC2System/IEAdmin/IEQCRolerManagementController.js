import {
  RoleManagment,
  QC2Task,
  IEWorkerTask,
} from "../../MongoDB/dbConnectionController.js";
import {
  getProcessKeywordForPage,
} from "../../../helpers/helperFunctions.js";

// GET - Check if a specific user has access to a page based on their assigned tasks.
export const checkUserAccess = async (req, res) => {
  try {
      const { emp_id, page } = req.query;

      if (!emp_id || !page) {
        return res
          .status(400)
          .json({ message: "Employee ID and page identifier are required." });
      }

      // Step 1: Check for Super Admin / Admin roles in the 'role_management' collection.
      // We use findOne with an $or condition to see if the user exists in either role.
      const adminCheck = await RoleManagment.findOne({
        $or: [
          { role: "Super Admin", "users.emp_id": emp_id },
          { role: "Admin", "users.emp_id": emp_id }
        ]
      });

      // If adminCheck finds a document, it means the user is an Admin or Super Admin.
      if (adminCheck) {
        return res.json({ hasAccess: true });
      }

      // If not an admin, proceed with the task-based check as before.
      const keyword = getProcessKeywordForPage(page);
      if (!keyword) {
        return res.json({ hasAccess: false }); // Not an admin and page is not IE-controlled
      }

      // const keyword = getProcessKeywordForPage(page);
      // if (!keyword) {
      //   return res.status(400).json({ message: "Invalid page identifier." });
      // }

      // *** THE FIX IS HERE ***
      // Conditionally build the regex based on the keyword.
      let processNameFilter;
      if (keyword.toLowerCase() === "packing") {
        // For 'packing', use word boundaries (\b) to match it as a whole word.
        processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
      } else {
        // For all other keywords, use the original substring match.
        processNameFilter = { $regex: keyword, $options: "i" };
      }

      // Step 1: Find all unique task numbers using the correct filter.
      const requiredTasksResult = await QC2Task.aggregate([
        { $match: { processName: processNameFilter } },
        { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
      ]);

      const requiredTaskNos =
        requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];
      if (requiredTaskNos.length === 0) {
        return res.json({ hasAccess: false });
      }

      const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();
      const userTasks = workerTask ? workerTask.tasks : [];
      if (userTasks.length === 0) {
        return res.json({ hasAccess: false });
      }

      const hasOverlap = userTasks.some((task) => requiredTaskNos.includes(task));
      res.json({ hasAccess: hasOverlap });
    } catch (error) {
      console.error("Error during IE access check:", error);
      res.status(500).json({ message: "Server error during access check." });
    }
};

// GET - Get a summary of which users have access to each managed page.
export const getAccessSummary = async (req, res) => {
  try {
    const pages = [
      { id: "bundle-registration", name: "Bundle Registration" },
      { id: "washing", name: "Washing" },
      { id: "opa", name: "OPA" },
      { id: "ironing", name: "Ironing" },
      { id: "packing", name: "Packing" },
      { id: "qc2-inspection", name: "QC2 Inspection" }
    ];

    const fullSummary = [];

    for (const page of pages) {
      const keyword = getProcessKeywordForPage(page.id);

      // *** THE FIX IS HERE ***
      // Apply the same conditional regex logic in the summary endpoint.
      let processNameFilter;
      if (keyword.toLowerCase() === "packing") {
        processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
      } else {
        processNameFilter = { $regex: keyword, $options: "i" };
      }

      // Get required task numbers for the page using the correct filter.
      const requiredTasksResult = await QC2Task.aggregate([
        { $match: { processName: processNameFilter } },
        { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
      ]);
      const requiredTaskNos =
        requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];

      let usersWithAccess = [];
      if (requiredTaskNos.length > 0) {
        usersWithAccess = await IEWorkerTask.aggregate([
          { $match: { tasks: { $in: requiredTaskNos } } },
          {
            $lookup: {
              from: "users",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "details"
            }
          },
          { $unwind: "$details" },
          { $match: { "details.working_status": "Working" } },
          {
            $project: {
              _id: 0,
              emp_id: "$emp_id",
              eng_name: "$details.eng_name",
              face_photo: "$details.face_photo",
              job_title: "$details.job_title",
              tasks: "$tasks"
            }
          },
          { $sort: { emp_id: 1 } }
        ]);
      }

      fullSummary.push({
        pageName: page.name,
        requiredTasks: requiredTaskNos.sort((a, b) => a - b),
        users: usersWithAccess
      });
    }

    res.json(fullSummary);
  } catch (error) {
    console.error("Error fetching IE role summary:", error);
    res.status(500).json({ message: "Server error fetching IE role summary." });
  }
};

export const getUniqueTaskNumbers = async (req, res) => {
  try {
      const { department } = req.query;
      if (!department) {
        return res.status(400).json({ message: "Department query is required." });
      }

      const taskNos = await QC2Task.distinct("taskNo", { department });

      res.json(taskNos.sort((a, b) => a - b));
    } catch (error) {
      console.error("Error fetching tasks by department:", error);
      res.status(500).json({ message: "Server error fetching tasks." });
    }
};

// GET - Fetch a user's task access rights (Admin status or assigned tasks)
export const getUserTaskAccess = async (req, res) => {
  try {
      const { emp_id } = req.params;
      if (!emp_id) {
        return res.status(400).json({ message: "Employee ID is required." });
      }

      // Check for Super Admin or Admin role first
      const adminCheck = await RoleManagment.findOne({
        $or: [
          { role: "Super Admin", "users.emp_id": emp_id },
          { role: "Admin", "users.emp_id": emp_id }
        ]
      });

      if (adminCheck) {
        // User is an admin, has access to all tasks
        return res.json({ isAdmin: true, assignedTasks: [] });
      }

      // If not an admin, find their specific tasks
      const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();

      res.json({
        isAdmin: false,
        assignedTasks: workerTask ? workerTask.tasks : []
      });
    } catch (error) {
      console.error("Error fetching user task access:", error);
      res.status(500).json({ message: "Server error fetching user access." });
    }
};