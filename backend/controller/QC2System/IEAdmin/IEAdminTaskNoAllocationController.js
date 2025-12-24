import { 
  QC2Task, 
} from "../../MongoDB/dbConnectionController.js";

// UPDATED - GET - Fetch all tasks with filtering AND pagination
export const saveTask = async (req, res) => {
  try {
      const {
        department,
        productType,
        processName,
        taskNo,
        page = 1,
        limit = 10
      } = req.body;
      const filter = {};
  
      if (department) filter.department = department;
      if (productType) filter.productType = productType;
      if (processName)
        filter.processName = { $regex: new RegExp(processName, "i") };
      if (taskNo) filter.taskNo = Number(taskNo);
  
      const skip = (page - 1) * limit;
  
      const tasks = await QC2Task.find(filter)
        .sort({ record_no: 1 })
        .skip(skip)
        .limit(limit);
  
      const totalTasks = await QC2Task.countDocuments(filter);
  
      res.json({
        tasks,
        totalPages: Math.ceil(totalTasks / limit),
        currentPage: page
      });
    } catch (error) {
      console.error("Error fetching IE tasks:", error);
      res.status(500).json({ message: "Server error fetching tasks." });
    }
};

// GET - Fetch distinct values for filters
export const getFilterOptions = async (req, res) => {
  try {
      const [departments, productTypes, processNames] = await Promise.all([
        QC2Task.distinct("department"),
        QC2Task.distinct("productType"),
        QC2Task.distinct("processName")
      ]);
      res.json({
        departments: departments.sort(),
        productTypes: productTypes.sort(),
        processNames: processNames.sort()
      });
    } catch (error) {
      console.error("Error fetching task filter options:", error);
      res.status(500).json({ message: "Server error fetching filter options." });
    }
};

// PUT - Update a task by its ID
export const updateTask = async (req, res) => {
  try {
      const { id } = req.params;
      const { taskNo } = req.body;
  
      if (taskNo === undefined || isNaN(Number(taskNo))) {
        return res.status(400).json({ message: "A valid Task No is required." });
      }
  
      const updatedTask = await QC2Task.findByIdAndUpdate(
        id,
        { taskNo: Number(taskNo) },
        { new: true, runValidators: true }
      );
  
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found." });
      }
      res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Server error updating task." });
    }
};

// DELETE - Delete a task by its ID
export const deleteTask = async (req, res) => {
   try {
      const { id } = req.params;
      const deletedTask = await QC2Task.findByIdAndDelete(id);
  
      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found." });
      }
      res.json({ message: "Task deleted successfully." });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Server error deleting task." });
    }
};
