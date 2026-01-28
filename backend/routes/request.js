const express = require("express");
const router = express.Router();
const {
    createRequest,
    getMyReceivedRequests,
    getMySentRequests,
    updateRequestStatus
} = require("../handlers/request-handler");

router.post("/create", async (req, res) => {
    const { task_id } = req.body;
    if (!task_id) return res.status(400).json({ message: "Task ID is required" });

    const result = await createRequest(task_id, req.user._id);
    return res.status(result.status).json({ message: result.message });
});

router.get("/received", async (req, res) => {
    const result = await getMyReceivedRequests(req.user._id);
    return res.status(result.status).json({ requests: result.requests, message: result.message });
});

router.get("/sent", async (req, res) => {
    const result = await getMySentRequests(req.user._id);
    return res.status(result.status).json({ requests: result.requests, message: result.message });
});

router.patch("/:requestId/status", async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const result = await updateRequestStatus(requestId, status, req.user._id);
    return res.status(result.status).json({ message: result.message });
});

module.exports = router;
