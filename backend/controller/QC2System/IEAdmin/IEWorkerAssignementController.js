import { 
  UserMain,
  QC2Task, 
  IEWorkerTask,
} from "../../MongoDB/dbConnectionController.js";

// GET - Fetch distinct values for all filters (ONLY from active workers in ym_eco_board)
export const getAllFilterOptions = async (req, res) => {
  try {
      const workingStatusFilter = { working_status: "Working" };
      const [empIds, empCodes, departments, sections, jobTitles, taskNos] =
        await Promise.all([
          UserMain.distinct("emp_id", workingStatusFilter),
          UserMain.distinct("emp_code", workingStatusFilter),
          UserMain.distinct("dept_name", workingStatusFilter),
          UserMain.distinct("sect_name", workingStatusFilter),
          UserMain.distinct("job_title", workingStatusFilter),
          QC2Task.distinct("taskNo")
        ]);
      res.json({
        empIds: empIds.filter(Boolean).sort(),
        empCodes: empCodes.filter(Boolean).sort(),
        departments: departments.filter(Boolean).sort(),
        sections: sections.filter(Boolean).sort(),
        jobTitles: jobTitles.filter(Boolean).sort(),
        taskNos: taskNos.filter(Boolean).sort((a, b) => a - b)
      });
    } catch (error) {
      console.error("Error fetching worker assignment filter options:", error);
      res.status(500).json({ message: "Server error fetching filter options." });
    }
};

// POST - Fetch paginated and filtered worker data (from users collection ONLY)
export const getWorkerData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      emp_id,
      emp_code,
      dept_name,
      sect_name,
      job_title
    } = req.body;
    let filter = { working_status: "Working" };
    if (emp_id) filter.emp_id = emp_id;
    if (emp_code) filter.emp_code = emp_code;
    if (dept_name) filter.dept_name = dept_name;
    if (sect_name) filter.sect_name = sect_name;
    if (job_title) filter.job_title = job_title;

    const skip = (page - 1) * limit;
    const totalUsers = await UserMain.countDocuments(filter);
    const workers = await UserMain.find(filter)
      .select(
        "emp_id emp_code eng_name kh_name job_title dept_name sect_name face_photo"
      )
      .sort({ emp_id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      workers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
      totalUsers
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ message: "Server error fetching workers." });
  }
};

// *** NEW ENDPOINT ***
// GET - Fetch ALL assigned tasks from the ie_worker_tasks collection
export const getAllAssignedTasks = async (req, res) => {
  try {
      const allAssignedTasks = await IEWorkerTask.find({}).lean();
      res.json(allAssignedTasks);
    } catch (error) {
      console.error("Error fetching all worker tasks:", error);
      res
        .status(500)
        .json({ message: "Server error fetching all assigned tasks." });
    }
};

// PUT - Update a worker's assigned tasks (This endpoint is correct and remains unchanged)
export const updateWorkerTasks = async (req, res) => {
  try {
      const { emp_id } = req.params;
      const { tasks, emp_code } = req.body;
      if (!Array.isArray(tasks)) {
        return res
          .status(400)
          .json({ message: "Tasks must be an array of numbers." });
      }
      const updatedWorkerTask = await IEWorkerTask.findOneAndUpdate(
        { emp_id },
        { $set: { tasks, emp_code } },
        { new: true, upsert: true, runValidators: true }
      );
      res.json({
        message: "Worker tasks updated successfully",
        data: updatedWorkerTask
      });
    } catch (error) {
      console.error("Error updating worker tasks:", error);
      res.status(500).json({ message: "Server error updating tasks." });
    }
};

// POST - Assign tasks to all workers with a specific job title
export const assignTasksToAllWorkers = async (req, res) => {
  const { job_title, tasks } = req.body;
  
    if (!job_title || !Array.isArray(tasks)) {
      return res
        .status(400)
        .json({ message: "Job title and a tasks array are required." });
    }
  
    try {
      const workersToUpdate = await UserMain.find(
        { job_title: job_title, working_status: "Working" },
        "emp_id emp_code"
      ).lean();
  
      if (workersToUpdate.length === 0) {
        return res.status(404).json({
          message: `No active workers found with job title: ${job_title}`
        });
      }
  
      const bulkOps = workersToUpdate.map((worker) => ({
        updateOne: {
          filter: { emp_id: worker.emp_id },
          update: {
            $set: {
              emp_code: worker.emp_code,
              tasks: tasks
            }
          },
          upsert: true
        }
      }));
  
      const result = await IEWorkerTask.bulkWrite(bulkOps);
  
      res.json({
        message: "Bulk assignment completed successfully.",
        ...result
      });
    } catch (error) {
      console.error("Error during bulk worker assignment:", error);
      res.status(500).json({ message: "Server error during bulk assignment." });
    }
};

// **** COMPLETELY REBUILT AND CORRECTED GET ENDPOINT ****
// GET - Fetch data for the bulk assignment summary table
export const getBulkAssignmentSummary = async (req, res) => {
  try {
    // The collection name for the UserMain model. Mongoose defaults to pluralizing the model name.
    // If your UserMain model's collection is named differently, change "users" below.
    const usersCollectionName = "users";

    const summary = await IEWorkerTask.aggregate([
      // Stage 1: Start from the tasks collection, which ONLY has assigned workers.
      // This is the key to the fix.

      // Stage 2: Lookup details for each worker from the main users collection.
      {
        $lookup: {
          from: usersCollectionName, // The actual collection name for UserMain
          localField: "emp_id",
          foreignField: "emp_id",
          as: "workerDetails"
        }
      },

      // Stage 3: De-construct the workerDetails array. If a worker in tasks doesn't exist
      // in the users collection anymore, this will correctly discard them.
      {
        $unwind: "$workerDetails"
      },

      // Stage 4: Only include workers who are currently "Working".
      {
        $match: {
          "workerDetails.working_status": "Working"
        }
      },

      // Stage 5: Group the results by the job title found in the worker's details.
      {
        $group: {
          _id: "$workerDetails.job_title",
          workers: {
            $push: {
              emp_id: "$emp_id",
              face_photo: "$workerDetails.face_photo",
              eng_name: "$workerDetails.eng_name",
              tasks: "$tasks" // Get tasks from the original ie_worker_tasks document
            }
          }
        }
      },

      // Stage 6: Format the output for the frontend.
      {
        $project: {
          _id: 0,
          jobTitle: "$_id",
          workers: 1
        }
      },

      { $sort: { jobTitle: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Error fetching bulk assignment summary:", error);
    res.status(500).json({ message: "Server error fetching summary." });
  }
};
