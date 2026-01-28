const Requests = require("../db/requests");
const Task = require("../db/task");

async function createRequest(taskId, requesterId) {
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return { status: 404, message: "Task not found" };
        }

        if (task.user_id.toString() === requesterId.toString()) {
            return { status: 400, message: "You cannot request your own task" };
        }

        const existingRequest = await Requests.findOne({ task_id: taskId, requester_id: requesterId });
        if (existingRequest) {
            return { status: 400, message: "Request already sent" };
        }

        const newRequest = new Requests({
            task_id: taskId,
            requester_id: requesterId,
            status: "pending"
        });

        await newRequest.save();
        return { status: 201, message: "Request sent successfully" };
    } catch (err) {
        console.error("Create Request error:", err);
        return { status: 500, message: "Failed to create request" };
    }
}

async function getMyReceivedRequests(userId) {
    try {
        // Find tasks owned by this user
        const myTaskIds = await Task.find({ user_id: userId }).distinct("_id");

        // Find requests for those tasks
        const requests = await Requests.find({ task_id: { $in: myTaskIds } })
            .populate("task_id", "title picture")
            .populate("requester_id", "first_name last_name email_id")
            .sort({ createdAt: -1 })
            .lean();

        // Transform data for frontend
        const formattedRequests = requests.map(r => ({
            _id: r._id,
            title: r.task_id?.title || "Unknown Task",
            picture: r.task_id?.picture,
            requestedBy: `${r.requester_id?.first_name || ""} ${r.requester_id?.last_name || ""}`.trim() || r.requester_id?.email_id || "User",
            status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            original_status: r.status
        }));

        return { status: 200, requests: formattedRequests };
    } catch (err) {
        console.error("Get Received Requests error:", err);
        return { status: 500, message: "Failed to fetch requests" };
    }
}

async function getMySentRequests(userId) {
    try {
        const requests = await Requests.find({ requester_id: userId })
            .populate("task_id", "title picture status")
            .sort({ createdAt: -1 })
            .lean();

        const formattedRequests = requests.map(r => ({
            _id: r._id,
            title: r.task_id?.title || "Unknown Task",
            picture: r.task_id?.picture,
            status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            task_status: r.task_id?.status
        }));

        return { status: 200, requests: formattedRequests };
    } catch (err) {
        console.error("Get Sent Requests error:", err);
        return { status: 500, message: "Failed to fetch your requests" };
    }
}

async function updateRequestStatus(requestId, status, userId) {
    try {
        const request = await Requests.findById(requestId).populate("task_id");
        if (!request) return { status: 404, message: "Request not found" };

        if (request.task_id.user_id.toString() !== userId.toString()) {
            return { status: 403, message: "Unauthorized to update this request" };
        }

        request.status = status;
        await request.save();

        return { status: 200, message: `Request ${status} successfully` };
    } catch (err) {
        console.error("Update Request Status error:", err);
        return { status: 500, message: "Failed to update request status" };
    }
}

module.exports = {
    createRequest,
    getMyReceivedRequests,
    getMySentRequests,
    updateRequestStatus
};
