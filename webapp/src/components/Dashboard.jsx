import React, { useState, useEffect, useCallback } from "react";
import { Upload } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import api from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();


  const [activePage, setActivePage] = useState("Feed");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [user, setUser] = useState({ username: "", email: "" });

  // TASKS
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);




  const handleLogout = async () => {
    if (logoutLoading) return;
    try {
      setLogoutLoading(true);
      await api.post("/auth/logout");
      setTimeout(() => navigate("/login"), 700);
    } catch {
      console.error("Logout failed");
    } finally {
      setLogoutLoading(false);
    }
  };


  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "",
    image: null,
    imagePreview: null,
  });


  // ================= LOAD DATA =================

  const loadFeed = async () => {
    try {
      const res = await api.get("/task/other");
      console.log("DEBUG: Feed tasks received:", res.data.tasks);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Feed load failed:", err);
    }
  };

  const loadMyTasks = async () => {
    try {
      const res = await api.get("/task/me");
      console.log("DEBUG: My tasks received:", res.data.tasks);
      setMyTasks(res.data.tasks || []);
    } catch (err) {
      console.error("My task load failed:", err);
    }
  };



  const loadRequests = async () => {
    try {
      const res = await api.get("/request/received");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Received requests load failed:", err);
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await api.get("/request/sent");
      setMyRequests(res.data.requests || []);
    } catch (err) {
      console.error("Sent requests load failed:", err);
    }
  };


  const loadUserProfile = async () => {
    try {
      const res = await api.get("/auth/me");

      // Handle different response structures
      const userData = res.data.user?.first_name || res.data.user?.last_name || res.data.user?.email_id
        ? {
          username: `${res.data.user.first_name || ""} ${res.data.user.last_name || ""}`.trim(),
          email: res.data.user.email_id
        }
        : res.data.user;

      if (userData) {
        setUser({
          username: userData.username || userData.name || "User",
          email: userData.email || "user@email.com"
        });

        // Also update settings
        setSettings({
          username: userData.username || userData.name || "User",
          email: userData.email || "user@email.com",
          notifications: true
        });
      }
    } catch (err) {
      console.error("Failed to load user profile:", err.message);
    }
  };

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadUserProfile(),
      loadFeed(),
      loadMyTasks(),
      loadRequests(),
      loadMyRequests(),
    ]);
  }, []);


  useEffect(() => {
    loadAll();
  }, [loadAll]);



  // ================= ADD TASK =================
  const handleAddTask = async () => {
    // Validation
    if (!newTask.title || !newTask.description || !newTask.category || !newTask.location || !newTask.startDate) {
      setNotifications((p) => [...p, "Error: All fields are required"]);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", newTask.title);
      formData.append("description", newTask.description);
      formData.append("category", newTask.category);
      formData.append("location", newTask.location);
      formData.append("start_time", newTask.startDate);
      formData.append("end_time", newTask.endDate || "");
      formData.append("status", "pending");
      formData.append("budget", newTask.budget || 0);

      if (newTask.image) formData.append("picture", newTask.image);


      const res = await api.post("/task/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setNotifications((p) => [...p, "Task added successfully"]);

      if (res.data?.task) {
        setTasks(prev => [res.data.task, ...prev]);
      }

      setNewTask({
        title: "",
        description: "",
        category: "",
        location: "",
        startDate: "",
        endDate: "",
        budget: "",
        image: null,
        imagePreview: null
      });

      setActivePage("My Tasks");
      await loadAll();

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Task creation failed";
      console.error("Task creation failed:", errorMsg);
      setNotifications((p) => [...p, `Error: ${errorMsg}`]);
    }
  };


  // ===== HANDLE REQUEST APPROVAL / REJECTION =====
  const handleApproveRequest = async (requestId) => {
    try {
      await api.patch(`/request/${requestId}/status`, { status: "accepted" });
      setNotifications(p => [...p, "Request approved"]);
      loadAll();
    } catch (err) {
      console.error("Approve failed:", err.response?.data || err.message);
      setNotifications(p => [...p, "Failed to approve request"]);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.patch(`/request/${requestId}/status`, { status: "rejected" });
      setNotifications(p => [...p, "Request rejected"]);
      loadAll();
    } catch (err) {
      console.error("Reject failed:", err.response?.data || err.message);
      setNotifications(p => [...p, "Failed to reject request"]);
    }
  };


  const [settings, setSettings] = useState({
    username: "",
    email: "",
    notifications: true,
  });

  const filteredTasks = (list) => {
    if (!Array.isArray(list)) return [];

    if (searchTerm.trim() === "") return list;

    return list.filter(t =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  };



  // ===== HANDLE IMAGE UPLOAD =====
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTask({
          ...newTask,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== HANDLE DRAG AND DROP =====
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTask({
          ...newTask,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please drop an image file');
    }
  };


  // ===== REMOVE IMAGE =====
  const handleRemoveImage = () => {
    setNewTask({
      ...newTask,
      image: null,
      imagePreview: null
    });
  };

  // ================= HANDLE REQUEST =================
  const handleRequestTask = async (task) => {
    if (!task) return;

    try {
      await api.post("/request/create", { task_id: task._id });
      setNotifications(prev => [...prev, `Request sent for "${task.title}"`]);
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send request";
      setNotifications(prev => [...prev, `Error: ${msg}`]);
    }
  };


  /* ================= EDIT TASK ================= */

  const handleUpdateTask = async () => {
    try {
      const fd = new FormData();
      fd.append("title", editingTask.title);
      fd.append("category", editingTask.category);
      fd.append("description", editingTask.description);
      fd.append("location", editingTask.location);
      fd.append("start_time", editingTask.start_time);
      fd.append("end_time", editingTask.end_time);
      fd.append("status", editingTask.status);


      if (editingTask.newImage) {
        fd.append("picture", editingTask.newImage);
      }

      await api.put(`/task/${editingTask._id}`, fd);

      setEditingTask(null);
      setNotifications(p => [...p, "Task updated successfully"]);
      loadAll();

    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
    }
  };


  return (
    <div className="dashboard-layout">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="sidebar">

        <div className="sidebar-header">
          <h3 className="logo">Hire-a-Helper</h3>
        </div>

        {/*  NAVIGATION */}
        <ul className="sidebar-menu">
          {["Feed", "My Tasks", "Requests", "My Requests", "Add Task", "Settings"].map(page => (
            <li
              key={page}
              className={activePage === page ? "active" : ""}
              onClick={() => setActivePage(page)}
            >
              {page}
            </li>
          ))}
        </ul>

        {/*  FOOTER (USER INFO + LOGOUT) */}
        <div className="sidebar-footer">

          <div className="sidebar-footer-info">
            <div className="sidebar-footer-user">
              {(user.username || "U").charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-footer-text">
              <strong>{user.username || settings.username || "User"}</strong>
              <span>{user.email || settings.email || "user@email.com"}</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Logout
          </button>

        </div>
      </aside>


      {/* ===== RIGHT SIDE WRAPPER ===== */}
      <div className="dashboard-right">

        {/* ================= TOP BAR ================= */}
        <div className="topbar">

          {/*  LEFT SIDE */}
          <div className="topbar-left">
            <span
              className="hamburger-icon"
              onClick={() => setShowMenu(true)}
              style={{ cursor: "pointer" }}
            >
              ☰
            </span>

            <h2>{activePage}</h2>
          </div>

          {/*  RIGHT SIDE */}
          <div className="topbar-actions">
            <input
              type="text"
              placeholder={`Search in ${activePage.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-badge">
                  {notifications.length}
                </span>
              )}
            </div>

            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <p style={{ padding: "10px" }}>No notifications</p>
                ) : (
                  notifications.map((note, index) => (
                    <p
                      key={index}
                      style={{ padding: "10px", borderBottom: "1px solid #eee" }}
                    >
                      {note}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        </div>



        {/* ================= MAIN CONTENT ================= */}
        <main className="main">

          {activePage === "Feed" && (
            <div className="feed">
              {filteredTasks(tasks).map(task => (

                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  handleRequestTask={handleRequestTask}
                />
              ))}
            </div>
          )}


          {/* ===== NEW ADD TASK ===== */}
          {activePage === "Add Task" && (
            <div className="add-task-container">
              <div className="add-task-form">
                <h2>Add Task</h2>

                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Task Description</label>
                  <textarea
                    placeholder="Describe the task you need help with"
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      placeholder="e.g., Moving, Gardening, Tech"
                      value={newTask.category}
                      onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="City, State"
                      value={newTask.location}
                      onChange={e => setNewTask({ ...newTask, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label> Start Date</label>
                    <input
                      type="date"
                      value={newTask.startDate}
                      onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label> End Date</label>
                    <input
                      type="date"
                      value={newTask.endDate}
                      onChange={e => setNewTask({ ...newTask, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Budget</label>
                  <input
                    type="number"
                    placeholder="Budget amount"
                    value={newTask.budget}
                    onChange={e => setNewTask({ ...newTask, budget: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Task Image</label>
                  {newTask.imagePreview ? (
                    <div className="image-preview-container">
                      <img src={newTask.imagePreview} alt="Preview" className="image-preview" />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={handleRemoveImage}
                      >
                        ✕ Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="task-image"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="task-image" className="file-upload-label">
                        <span><Upload /></span>Upload a file or drag and drop
                        <span>PNG, JPG, GIF up to 10MB</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button className="btn-submit" onClick={handleAddTask}>
                    Add Task
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {
            activePage === "Settings" && (
              <div className="settings-page">
                <input placeholder="Username" value={settings.username}
                  onChange={e => setSettings({ ...settings, username: e.target.value })} />
                <input placeholder="Email" value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })} />
              </div>
            )
          }

          {/* ===== MY TASKS ===== */}
          {
            activePage === "My Tasks" && (
              <>
                <div className="my-tasks-header">
                  <h2> </h2>

                  <button
                    className="add-task-btn"
                    onClick={() => setActivePage("Add Task")}
                  >
                    + Add New Task
                  </button>
                </div>

                <div className="feed my-tasks-section">
                  {filteredTasks(myTasks).map(task => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      editable={true}
                      onEdit={setEditingTask}
                    />
                  ))}
                </div>
              </>
            )
          }


          {/* ===== REQUESTS ===== */}
          {
            activePage === "Requests" && (
              <div className="feed">
                {filteredTasks(requests).map(task => (
                  <div key={task._id || task.id} className="task-card">
                    {task.picture && (
                      <img src={task.picture} alt={task.title} className="task-image" />
                    )}

                    <h3>{task.title}</h3>
                    <p>Requested by: {task.requestedBy}</p>
                    <p>Status: {task.status}</p>

                    {task.status === "Pending" && (
                      <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
                        <button
                          style={{ background: "#22c55e", color: "#fff" }}
                          onClick={() => handleApproveRequest(task._id || task.id)}
                        >
                          Approve
                        </button>

                        <button
                          style={{ background: "#ef4444", color: "#fff" }}
                          onClick={() => handleRejectRequest(task._id || task.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }



          {/* ===== MY REQUESTS ===== */}
          {
            activePage === "My Requests" && (
              <div className="feed">
                {filteredTasks(myRequests).map(task => (
                  <div key={task._id} className="task-card">
                    {task.picture && (
                      <img src={task.picture} alt={task.title} className="task-image" />
                    )}
                    <h3>{task.title}</h3>
                    <p>Status: <span className={`status-badge status-${task.status.toLowerCase()}`}>{task.status}</span></p>
                    {task.task_status && <p>Task Status: {task.task_status}</p>}
                  </div>
                ))}
                {myRequests.length === 0 && <p style={{ textAlign: "center", padding: "20px" }}>You haven't requested any tasks yet.</p>}
              </div>
            )
          }

        </main >



        {/* ===== EDIT MODAL ===== */}
        {
          editingTask && (
            <div className="modal-overlay">
              <div className="modal edit-modal">

                <h2>Edit Task</h2>

                <label>Title</label>
                <input
                  type="text"
                  value={editingTask.title || ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                />

                <label>Category</label>
                <input
                  type="text"
                  value={editingTask.category || ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, category: e.target.value })
                  }
                  placeholder="e.g., Cleaning, Tech, Moving"
                />


                <label>Description</label>
                <textarea
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, description: e.target.value })
                  }
                />

                <label>Location</label>
                <input
                  type="text"
                  value={editingTask.location || ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, location: e.target.value })
                  }
                />

                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={editingTask.start_time ? editingTask.start_time.slice(0, 16) : ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, start_time: e.target.value })
                  }
                />

                {/*  END DATE */}
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={editingTask.end_time ? editingTask.end_time.slice(0, 16) : ""}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, end_time: e.target.value })
                  }
                />

                <label>Status</label>
                <select
                  value={editingTask.status || "pending"}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label>Change Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      newImage: e.target.files[0]
                    })
                  }
                />

                <div className="modal-actions">
                  <button onClick={handleUpdateTask}>Update</button>
                  <button onClick={() => setEditingTask(null)}>Cancel</button>
                </div>

              </div>
            </div>
          )
        }



        {/* ================= HAMBURGER MENU ================= */}
        {
          showMenu && (
            <div className="hamburger-overlay" onClick={() => setShowMenu(false)}>
              <div className="hamburger-menu" onClick={e => e.stopPropagation()}>
                <h3>Hire-a-Helper</h3>

                <ul className="menu-list">
                  {["Feed", "My Tasks", "Requests", "My Requests", "Add Task", "Settings"].map(page => (
                    <li
                      key={page}
                      onClick={() => {
                        setActivePage(page);
                        setShowMenu(false);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {page}
                    </li>
                  ))}
                </ul>

                <div className="sidebar-footer">
                  <div className="sidebar-footer-user">
                    {(user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <strong>{user.username || settings.username || "User"}</strong>
                  <span>{user.email || settings.email || "user@email.com"}</span>
                  <button
                    className="logout-btn"
                    onClick={() => {
                      setShowMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* ================= LOGOUT CONFIRM ================= */}
        {
          showLogoutConfirm && (
            <div className="modal-overlay">
              <div className="modal">
                <p style={{ textAlign: "center", marginBottom: "20px" }}>Do you really want to logout?</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                  <button onClick={handleLogout}>YES</button>
                  <button onClick={() => setShowLogoutConfirm(false)}>NO</button>
                </div>
              </div>
            </div>
          )
        }

      </div >
    </div >

  );
};

const TaskCard = ({ task, handleRequestTask, editable = false, onEdit }) => {
  if (!task) return null;

  return (
    <div className="task-card">
      {task.picture && (
        <img src={task.picture} alt={task.title || "task"} className="task-image" />
      )}
      <div className="badges-container">

        <div className="tag">{task.category || "General"}</div>

        {/* Status badge for My Tasks */}
        {editable && task.status && (
          <div className={`status-badge status-${task.status.toLowerCase()}`}>
            {task.status}
          </div>
        )}
      </div>

      <div className="card-content">
        <h3>{task.title}</h3>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {task.location && (
          <p className="task-location">
            <span className="icon">📍</span> {task.location}
          </p>
        )}

        {task.start_time && (
          <p className="task-date">
            <span className="icon">🟢</span>
            Start: {new Date(task.start_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })} • {new Date(task.start_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        )}

        {task.end_time && (
          <p className="task-date end-date">
            <span className="icon">🔴</span>
            End: {new Date(task.end_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })} • {new Date(task.end_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        )}

        <div className="task-footer">
          <div className="task-author">
            <div className="author-avatar">
              {(task.user_id?.first_name || task.user?.username || "U").charAt(0).toUpperCase()}
            </div>
            <span className="author-name">
              {task.user_id?.first_name
                ? `${task.user_id.first_name}${task.user_id.last_name ? ' ' + task.user_id.last_name : ''}`
                : task.user?.username || "User"
              }
            </span>
          </div>

          {/* ===== MY TASKS → EDIT ===== */}
          {editable && (
            <button className="edit-btn" onClick={() => onEdit(task)}>
              ✏️ Edit Task
            </button>
          )}

          {/* ===== FEED → REQUEST ===== */}
          {!editable && handleRequestTask && (
            <button className="request-btn" onClick={() => handleRequestTask(task)}>
              Request Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;