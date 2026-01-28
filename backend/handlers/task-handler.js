const uploadToCloudinary = require('../utils/uploadToCloudinary');
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");
const Task = require('../db/task');
const allowedStatus = Object.freeze([
  "pending",
  "active",
  "completed",
  "cancelled"
]);

async function createTask(model, file, userId) {
  console.log("createTask - Received model:", model);
  console.log("createTask - User ID:", userId);
  try {
    let Img = null;
    if (file) {
      try {
        Img = await uploadToCloudinary(file.path, 'tasks');
      } catch (err) {
        console.error("Failed to upload image to Cloudinary:", err);
        return {
          status: 500,
          message: "Failed to upload image to cloud. Please try again later."
        };
      }
    }

    let task = new Task({
      user_id: userId,
      title: model.title,
      description: model.description || '',
      location: model.location,
      start_time: model.start_time,
      end_time: model.end_time || null,
      category: model.category,
      budget: model.budget || null,
      picture: Img ? Img.secure_url : null,
      picture_public_id: Img ? Img.public_id : null,
      status: allowedStatus.includes(model.status) ? model.status : "pending",
    });

    await task.save();
    return { status: 201, message: "Task created successfully.", taskId: task._id };
  } catch (err) {
    console.error("Create Task error:", err);
    return { status: 500, message: "Something went wrong while saving your task." };
  }
};


async function updateTask(taskId, model, file, userId) {
  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return { status: 404, message: "Task not found" };
    }

    if (task.user_id.toString() !== userId.toString()) {
      return { status: 403, message: "You are not allowed to edit this task" };
    }

    let imageUrl = task.picture;
    let publicId = task.picture_public_id;

    if (file) {
      try {
        const uploadedImg = await uploadToCloudinary(file.path, "tasks");

        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (err) {
            console.error("Failed to delete old image from Cloudinary:", err);
          }
        }

        imageUrl = uploadedImg.secure_url;
        publicId = uploadedImg.public_id;
      } catch (err) {
        return {
          status: 500,
          message: "Failed to upload image. Please try again."
        };
      }
    }



    task.title = model.title ?? task.title;
    task.description = model.description ?? task.description;
    task.location = model.location ?? task.location;
    task.start_time = model.start_time ?? task.start_time;
    task.end_time = model.end_time ?? task.end_time;
    task.category = model.category ?? task.category;
    task.budget = model.budget ?? task.budget;
    task.picture = imageUrl;
    task.picture_public_id = publicId;
    task.status = allowedStatus.includes(model.status) ? model.status : task.status;

    await task.save();

    return {
      status: 200,
      message: "Task updated successfully",
      taskId: task._id
    };
  } catch (err) {
    console.error("Update Task error:", err);
    return {
      status: 500,
      message: "Something went wrong while updating the task"
    };
  }
}


async function getUserTasks(userId) {
  console.log("getUserTasks - Fetching for user:", userId);
  try {
    const user_tasks = await Task.find({ user_id: userId })
      .select("title description location picture status start_time end_time category budget")
      .sort({ createdAt: -1 })
      .lean();
    console.log(`getUserTasks - Found ${user_tasks.length} tasks for user ${userId}`);

    return {
      status: 200,
      message: "User tasks fetched successfully",
      tasks: user_tasks
    };
  } catch (err) {
    console.error("Get User Tasks error:", err);
    return {
      status: 500,
      message: "Failed to fetch user tasks"
    };
  }
}

async function getOtherUserTasks(userId) {
  console.log("getOtherUserTasks - Fetching for user (excluding):", userId);
  try {
    const other_user_tasks = await Task.find({
      user_id: { $ne: userId },
      status: { $in: ["pending", "active"] }
    })
      .select("title description location picture status start_time end_time category budget user_id")
      .populate({
        path: "user_id",
        select: "first_name last_name -_id"
      })
      .sort({ createdAt: -1 })
      .lean();
    console.log(`getOtherUserTasks - Found ${other_user_tasks.length} tasks`);

    return {
      status: 200,
      message: "Other users tasks fetched successfully",
      tasks: other_user_tasks
    };
  } catch (err) {
    console.error("Get Other User Tasks error:", err);
    return {
      status: 500,
      message: "Failed to fetch other users tasks"
    };
  }
}


async function changeTaskStatus(taskId, status, userId) {
  try {

    if (!allowedStatus.includes(status)) {
      return {
        status: 400,
        message: "Invalid status value"
      };
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return {
        status: 404,
        message: "Task not found"
      };
    }

    if (task.user_id.toString() !== userId.toString()) {
      return {
        status: 403,
        message: "You are not allowed to change status of this task"
      };
    }

    task.status = status;
    await task.save();

    return {
      status: 200,
      message: "Task status updated successfully"
    };
  } catch (err) {
    console.error("Change Task Status error:", err);
    return {
      status: 500,
      message: "Failed to update task status"
    };
  }
}


module.exports = {
  createTask,
  updateTask,
  getUserTasks,
  getOtherUserTasks,
  changeTaskStatus
};
