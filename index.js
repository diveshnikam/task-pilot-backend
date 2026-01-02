// IMPORT REQUIRED PACKAGES

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");


// CORS SETUP

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// DB CONNECTION

const { initDatabse } = require("./db/db.connect");
initDatabse();

// MODELS

const User = require("./models/users");
const ForgotPasswordVerification = require("./models/forgotPasswordVerificationSchema");
const Team = require("./models/team")
const Tag = require("./models/tag")
const Project = require("./models/project")
const Task = require("./models/task")

const SignupVerification = require("./models/signupVerificationSchema");

// REGEX VALIDATION

const emailRegex =
  /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*\.(com|co|uk|in|org|net|io|co\.uk|co\.in)$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ROOT ROUTE

app.get("/", (req, res) => {
  res.send("Auth server running...");
});

// EMAIL SENDER (INLINE)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"TaskPilot" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

// OTP GENERATOR

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();



// VALID OBJECT ID CHECKER

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// TEAM NAME VALIDATOR

const teamNameRegex = /^[A-Za-z ]+$/;

const validateTeamName = (name) => {
  if (!name || name.trim() === "") {
    return "Team name is required";
  }

  if (!teamNameRegex.test(name)) {
    return "Team name can contain only letters and spaces";
  }

  if (name.trim().length < 2) {
    return "Team name must be at least 2 characters long";
  }

  return null;
};







// SIGNUP SEND OTP

const sendSignupOTP = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  email = email.toLowerCase();

  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must have at least 1 uppercase letter, 1 number, 1 special character, and minimum 8 characters"
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  await SignupVerification.deleteOne({ email });

  const otp = generateOTP();

  const passwordHash = password;

  await SignupVerification.create({
    name,
    email,
    passwordHash,
    otp,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: "Verify your email - TaskPilot",
    text: `Your OTP is ${otp}. It is valid for 3 minutes.`,
  });
};

app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    await sendSignupOTP({ name, email, password });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SIGNUP  VERIFY OTP

const verifySignupOTP = async ({ email, otp }) => {
  email = email.toLowerCase();

  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const record = await SignupVerification.findOne({ email });

  if (!record || record.otp !== otp) {
    throw new Error("Invalid Email / Invalid or expired OTP");
  }

  const user = new User({
    name: record.name,
    email: record.email,
    password: record.passwordHash,
  });

  await user.save();

  await SignupVerification.deleteOne({ email });

  return user;
};

app.post("/auth/verify-signup", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await verifySignupOTP({ email, otp });

    res.status(201).json({
      message: "Signup successful",
      userId: user._id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Resend Signup OTP

app.post("/auth/resend-signup-otp", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    email = email.toLowerCase();

    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    if (!passwordRegex.test(password)) {
      throw new Error(
        "Password must have at least 1 uppercase, 1 number, 1 special character and minimum 8 characters"
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already registered. Please login.");
    }

    const record = await SignupVerification.findOne({ email });

    if (!record) {
      throw new Error("OTP expired. Please sign up again.");
    }

    if (record.expiresAt < new Date()) {
      await SignupVerification.deleteOne({ email });
      throw new Error("OTP expired. Please sign up again.");
    }

    const isMatch = await bcrypt.compare(password, record.passwordHash);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    const otp = generateOTP();

    record.otp = otp;
    record.expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    await record.save();

    await sendEmail({
      to: email,
      subject: "Your new OTP - TaskPilot",
      text: `Your new OTP is ${otp}. It is valid for 3 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN USER

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  email = email.toLowerCase();

  if (!emailRegex.test(email)) {
    throw new Error("Invalid email or password");
  }

  if (!passwordRegex.test(password)) {
    throw new Error("Invalid email or password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

app.post("/auth/login", async (req, res) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AUTH MIDDLEWARE

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

app.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user);
});


//Forgot Password - Send OTP


const sendForgotPasswordOTP = async ({ email }) => {
  if (!email) {
    throw new Error("Email is required");
  }

  email = email.toLowerCase();

  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  await ForgotPasswordVerification.deleteOne({ email });

  const otp = generateOTP();

  await ForgotPasswordVerification.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: "Reset your password - TaskPilot",
    text: `Your password reset OTP is ${otp}. It is valid for 3 minutes.`,
  });
};


app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    await sendForgotPasswordOTP({ email });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Resend Forgot Password OTP

app.post("/auth/resend-forgot-password-otp", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      throw new Error("Email is required");
    }

    email = email.toLowerCase();

    const record = await ForgotPasswordVerification.findOne({ email });

    if (!record) {
      throw new Error("OTP expired. Please try again.");
    }

    if (record.expiresAt < new Date()) {
      await ForgotPasswordVerification.deleteOne({ email });
      throw new Error("OTP expired. Please try again.");
    }

    const otp = generateOTP();

    record.otp = otp;
    record.expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    await record.save();

    await sendEmail({
      to: email,
      subject: "Your new reset OTP - TaskPilot",
      text: `Your new OTP is ${otp}. It is valid for 3 minutes.`,
    });

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Forgot Password - Verify OTP

const verifyForgotPasswordOTP = async ({ email, otp }) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  email = email.toLowerCase();

  const record = await ForgotPasswordVerification.findOne({ email });

  if (!record || record.otp !== otp) {
    throw new Error("Invalid or expired OTP");
  }

  return true;
};

app.post("/auth/verify-forgot-password", async (req, res) => {
  try {
    const { email, otp } = req.body;

    await verifyForgotPasswordOTP({ email, otp });

    res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//Forgot Password - Reset Password

app.post("/auth/reset-password", async (req, res) => {
  try {
    let { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw new Error("Email and new password are required");
    }

    email = email.toLowerCase();

    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        "Password must have at least 1 uppercase, 1 number, 1 special character and minimum 8 characters"
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    user.password = newPassword;
    await user.save();

    await ForgotPasswordVerification.deleteOne({ email });

    res.status(200).json({
      message: "Password reset successful. Please login again.",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//Create Team 

const createTeam = async (name, description) => {
  try {
    
    const nameError = validateTeamName(name);
    if (nameError) {
      throw new Error(nameError);
    }

    
    const existingTeam = await Team.findOne({ name: name.trim() });
    if (existingTeam) {
      throw new Error("Team already exists");
    }

   
    const newTeam = new Team({
      name: name.trim(),
      description: description ? description.trim() : undefined
    });

    return await newTeam.save();
  } catch (error) {
    throw error;
  }
};

app.post("/teams", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const team = await createTeam(name, description);

    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({
      error: "Failed to create team",
      errorMessage: error.message
    });
  }
});


//Update Team

const updateTeam = async (id, name, description) => {
  try {
   
    if (!isValidObjectId(id)) {
      throw new Error("Invalid Team ID");
    }

    
    const team = await Team.findById(id);
    if (!team) {
      throw new Error("Team not found");
    }

    const updateData = {};

    
    if (name !== undefined) {
      const nameError = validateTeamName(name);
      if (nameError) {
        throw new Error(nameError);
      }

      
      const duplicateTeam = await Team.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });

      if (duplicateTeam) {
        throw new Error("Team name already exists");
      }

      updateData.name = name.trim();
    }

   
    if (description !== undefined) {
      const desc = description.trim();
      updateData.description = desc ? desc : undefined;
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedTeam;
  } catch (error) {
    throw error;
  }
};


app.post("/teams/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedTeam = await updateTeam(id, name, description);

    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(400).json({
      error: "Failed to update team",
      errorMessage: error.message
    });
  }
});


//Delete Team

const deleteTeam = async (id) => {
  try {
    
    if (!isValidObjectId(id)) {
      throw new Error("Invalid Team ID");
    }

   
    const team = await Team.findById(id);
    if (!team) {
      throw new Error("Team not found");
    }

   
    await Team.findByIdAndDelete(id);

    return true;
  } catch (error) {
    throw error;
  }
};

app.delete("/teams/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await deleteTeam(id);

    res.status(200).json({
      message: "Team deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to delete team",
      errorMessage: error.message
    });
  }
});

//get all teams 

const getAllTeams = async () => {
  return await Team.find().sort({ name: 1 });
};


app.get("/teams", authMiddleware, async (req, res) => {
  try {
    const teams = await getAllTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get team details by id

const getTeamDetailsOnly = async (teamId) => {
  if (!isValidObjectId(teamId)) throw new Error("Invalid Team ID");

  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");

  return team;
};

app.get("/teams/:id/details", authMiddleware, async (req, res) => {
  try {
    const team = await getTeamDetailsOnly(req.params.id);
    res.json(team);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// get team tasks with filters

const getTeamTasks = async (teamId, query) => {
  if (!isValidObjectId(teamId)) throw new Error("Invalid Team ID");
  if (!(await Team.findById(teamId))) throw new Error("Team not found");

  const filter = { team: teamId };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  if (query.project) {
    if (!isValidObjectId(query.project)) throw new Error("Invalid Project ID");
    if (!(await Project.findById(query.project))) throw new Error("Project not found");
    filter.project = query.project;
  }

  if (query.owner) {
    if (!isValidObjectId(query.owner)) throw new Error("Invalid Owner ID");
    if (!(await User.findById(query.owner))) throw new Error("Owner not found");
    filter.owners = { $in: [query.owner] };
  }

  if (query.tag) {
    if (!isValidObjectId(query.tag)) throw new Error("Invalid Tag ID");
    if (!(await Tag.findById(query.tag))) throw new Error("Tag not found");
    filter.tags = { $in: [query.tag] };
  }

  const tasks = await Task.find(filter)
    .populate("project")
    .populate("owners")
    .populate("tags");

  return { totalTasks: tasks.length, tasks };
};




app.get("/teams/:id/tasks", authMiddleware, async (req, res) => {
  try {
    const data = await getTeamTasks(req.params.id, req.query);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// tag name validator\

const tagNameRegex = /^[A-Za-z0-9 _-]+$/;

const validateTagName = (name) => {
  if (!name || name.trim() === "") return "Tag name is required";
  if (!tagNameRegex.test(name)) return "Invalid characters in tag name";
  if (name.trim().length < 2) return "Tag name must be at least 2 characters";
  return null;
};

const createTag = async (name) => {
  const error = validateTagName(name);
  if (error) throw new Error(error);

  const exists = await Tag.findOne({ name: name.trim() });
  if (exists) throw new Error("Tag already exists");

  const tag = new Tag({ name: name.trim() });
  return await tag.save();
};


app.post("/tags", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await createTag(name);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get All Tags

const getAllTags = async () => {
  try {
    return await Tag.find().sort({ name: 1 });
  } catch (error) {
    throw new Error("Failed to fetch tags");
  }
};

app.get("/tags", authMiddleware, async (req, res) => {
  try {
    const tags = await getAllTags();
    res.json(tags);  
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch tags",
      errorMessage: error.message
    });
  }
});

//delet Tag

const deleteTag = async (id) => {
  try {
    if (!isValidObjectId(id)) {
      throw new Error("Invalid Tag ID");
    }

    const tag = await Tag.findById(id);
    if (!tag) {
      throw new Error("Tag not found");
    }

    await Tag.findByIdAndDelete(id);
    return true;
  } catch (error) {
    throw error;
  }
};


app.delete("/tags/:id", authMiddleware, async (req, res) => {
  try {
    await deleteTag(req.params.id);
    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    res.status(400).json({
      error: "Failed to delete tag",
      errorMessage: error.message
    });
  }
});


//project name validator

const projectNameRegex = /^[A-Za-z0-9 _-]+$/;

const validateProjectName = (name) => {
  if (!name || name.trim() === "") return "Project name is required";
  if (!projectNameRegex.test(name)) return "Invalid characters in project name";
  if (name.trim().length < 2) return "Project name must be at least 2 characters";
  return null;
};


//create Project

const createProject = async (name, description) => {
  const error = validateProjectName(name);
  if (error) throw new Error(error);

  const exists = await Project.findOne({ name: name.trim() });
  if (exists) throw new Error("Project already exists");

  const project = new Project({
    name: name.trim(),
    description: description ? description.trim() : undefined
  });

  return await project.save();
};

app.post("/projects", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await createProject(name, description);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//update Project

const updateProject = async (id, name, description) => {
  if (!isValidObjectId(id)) throw new Error("Invalid Project ID");

  const project = await Project.findById(id);
  if (!project) throw new Error("Project not found");

  const updateData = {};

  if (name !== undefined) {
    const err = validateProjectName(name);
    if (err) throw new Error(err);

    const duplicate = await Project.findOne({
      name: name.trim(),
      _id: { $ne: id }
    });
    if (duplicate) throw new Error("Project name already exists");

    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = description.trim() || undefined;
  }

  return await Project.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
};


app.post("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await updateProject(req.params.id, name, description);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete Project

const deleteProject = async (id) => {
  if (!isValidObjectId(id)) throw new Error("Invalid Project ID");

  const project = await Project.findById(id);
  if (!project) throw new Error("Project not found");

  // delete all tasks under this project
  await Task.deleteMany({ project: id });

  // then delete project
  await Project.findByIdAndDelete(id);

  return true;
};


app.delete("/projects/:id", authMiddleware, async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({ message: "Project and its tasks deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get All Projects

const getAllProjects = async () => {
  try {
    return await Project.find().sort({ name: 1 });
  } catch (error) {
    throw new Error("Failed to fetch projects");
  }
};


app.get("/projects", authMiddleware, async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch projects",
      errorMessage: error.message
    });
  }
});


//get project by id

const getProjectById = async (id) => {
  if (!isValidObjectId(id)) throw new Error("Invalid Project ID");

  const project = await Project.findById(id);
  if (!project) throw new Error("Project not found");

  return project;
};


app.get("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(404).json({
      error: "Failed to fetch project",
      errorMessage: error.message
    });
  }
});

// get project tasks with filters

const getProjectTasks = async (projectId, query) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");
  if (!(await Project.findById(projectId))) throw new Error("Project not found");

  const filter = { project: projectId };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  if (query.team) {
    if (!isValidObjectId(query.team)) throw new Error("Invalid Team ID");
    if (!(await Team.findById(query.team))) throw new Error("Team not found");
    filter.team = query.team;
  }

  if (query.owner) {
    if (!isValidObjectId(query.owner)) throw new Error("Invalid Owner ID");
    if (!(await User.findById(query.owner))) throw new Error("Owner not found");
    filter.owners = { $in: [query.owner] };
  }

  if (query.tag) {
    if (!isValidObjectId(query.tag)) throw new Error("Invalid Tag ID");
    if (!(await Tag.findById(query.tag))) throw new Error("Tag not found");
    filter.tags = { $in: [query.tag] };
  }

  const tasks = await Task.find(filter)
    .populate("team")
    .populate("owners")
    .populate("tags");

  return { totalTasks: tasks.length, tasks };
};


app.get("/projects/:id/tasks", authMiddleware, async (req, res) => {
  try {
    const data = await getProjectTasks(req.params.id, req.query);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Task Name Validator
const taskNameRegex = /^[A-Za-z0-9 ._-]+$/;
const validateTaskName = (name) => {
  if (!name || name.trim() === "") return "Task name is required";
  if (!taskNameRegex.test(name)) return "Task name contains invalid characters";
  if (name.trim().length < 2) return "Task name must be at least 2 characters";
  return null;
};

// Time Validator
const validateTimeToComplete = (value) => {
  if (value === undefined || value === null) return "Time to complete is required";
  if (!Number.isInteger(value)) return "Time to complete must be a whole number";
  if (value < 1) return "Time to complete must be at least 1 day";
  return null;
};

// Status Validator
const allowedStatuses = ["To Do", "In Progress", "Completed", "Blocked"];
const validateStatus = (status) => {
  if (!status) return null;
  if (!allowedStatuses.includes(status)) return "Invalid status value";
  return null;
};

// Priority Validator
const allowedPriorities = ["Low", "Medium", "High"];
const validatePriority = (priority) => {
  if (!priority) return null;
  if (!allowedPriorities.includes(priority)) return "Invalid priority value";
  return null;
};


// create task 

const createTask = async (data) => {
  const { name, project, team, owners, tags, timeToComplete, status, priority } = data;

  const nameErr = validateTaskName(name);
  if (nameErr) throw new Error(nameErr);

  const timeErr = validateTimeToComplete(timeToComplete);
  if (timeErr) throw new Error(timeErr);

  const statusErr = validateStatus(status);
  if (statusErr) throw new Error(statusErr);

  const priorityErr = validatePriority(priority);
  if (priorityErr) throw new Error(priorityErr);

  if (!isValidObjectId(project) || !(await Project.findById(project)))
    throw new Error("Invalid Project ID");

  if (!isValidObjectId(team) || !(await Team.findById(team)))
    throw new Error("Invalid Team ID");

  for (let o of owners) {
    if (!isValidObjectId(o) || !(await User.findById(o)))
      throw new Error("Invalid Owner ID");
  }

  if (tags) {
    for (let t of tags) {
      if (!isValidObjectId(t) || !(await Tag.findById(t)))
        throw new Error("Invalid Tag ID");
    }
  }

  const uniqueOwners = [...new Set(owners.map(String))];
  const uniqueTags = tags ? [...new Set(tags.map(String))] : [];

  const task = new Task({
    name: name.trim(),
    project,
    team,
    owners: uniqueOwners,
    tags: uniqueTags,
    timeToComplete,
    status,
    priority
  });

  return await task.save();
};

app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get all tasks 

const getAllTasks = async (query) => {
  const filter = {};

  if (query.team) {
    if (!isValidObjectId(query.team) || !(await Team.findById(query.team)))
      throw new Error("Invalid Team ID");
    filter.team = query.team;
  }

  if (query.project) {
    if (!isValidObjectId(query.project) || !(await Project.findById(query.project)))
      throw new Error("Invalid Project ID");
    filter.project = query.project;
  }

  if (query.owner) {
    if (!isValidObjectId(query.owner) || !(await User.findById(query.owner)))
      throw new Error("Invalid Owner ID");
    filter.owners = { $in: [query.owner] };
  }

  if (query.tag) {
    if (!isValidObjectId(query.tag) || !(await Tag.findById(query.tag)))
      throw new Error("Invalid Tag ID");
    filter.tags = { $in: [query.tag] };
  }

  if (query.status) filter.status = query.status.trim();
  if (query.priority) filter.priority = query.priority.trim();

  const allowedSorts = ["recent", "priority"];

  if (query.sort && !allowedSorts.includes(query.sort)) {
    throw new Error(`Invalid sort value. Allowed: ${allowedSorts.join(", ")}`);
  }

  
  const sort = {};
  if (query.sort === "recent") sort.createdAt = -1;
  if (query.sort === "priority") sort.priority = -1;

  const tasks = await Task.find(filter)
    .populate("team project owners tags")
    .sort(sort);

  return { totalTasks: tasks.length, tasks };
};


app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const data = await getAllTasks(req.query);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get task by id

const getTaskById = async (taskId) => {
  if (!isValidObjectId(taskId))
    throw new Error("Invalid Task ID");

  const task = await Task.findById(taskId)
    .populate("project")
    .populate("team")
    .populate("owners")
    .populate("tags");

  if (!task) throw new Error("Task not found");

  return task;
};


app.get("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// update task

const updateTask = async (taskId, data) => {
  const { name, project, team, owners, tags, timeToComplete, status, priority } = data;

  const nameErr = validateTaskName(name);
  if (nameErr) throw new Error(nameErr);

  const timeErr = validateTimeToComplete(timeToComplete);
  if (timeErr) throw new Error(timeErr);

  const statusErr = validateStatus(status);
  if (statusErr) throw new Error(statusErr);

  const priorityErr = validatePriority(priority);
  if (priorityErr) throw new Error(priorityErr);

  if (!isValidObjectId(taskId))
    throw new Error("Invalid Task ID");

  if (!isValidObjectId(project) || !(await Project.findById(project)))
    throw new Error("Invalid Project ID");

  if (!isValidObjectId(team) || !(await Team.findById(team)))
    throw new Error("Invalid Team ID");

  for (let o of owners) {
    if (!isValidObjectId(o) || !(await User.findById(o)))
      throw new Error("Invalid Owner ID");
  }

  if (tags) {
    for (let t of tags) {
      if (!isValidObjectId(t) || !(await Tag.findById(t)))
        throw new Error("Invalid Tag ID");
    }
  }

  const uniqueOwners = [...new Set(owners.map(String))];
  const uniqueTags = tags ? [...new Set(tags.map(String))] : [];

    let completedAtUpdate = null;

  if (status === "Completed") {
    completedAtUpdate = new Date();
  }


  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    {
      name: name.trim(),
      project,
      team,
      owners: uniqueOwners,
      tags: uniqueTags,
      timeToComplete,
      status,
      priority,
      completedAt: completedAtUpdate,

    },
    { new: true }
  );

  if (!updatedTask) throw new Error("Task not found");

  return updatedTask;
};


app.post("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete task

const deleteTask = async (taskId) => {
  if (!isValidObjectId(taskId))
    throw new Error("Invalid Task ID");

  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  await Task.findByIdAndDelete(taskId);
  return true;
};


app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Tasks Completed Last Week

const getLastWeekCompletedTasks = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tasks = await Task.find({
    status: "Completed",
    completedAt: { $gte: sevenDaysAgo }
  }).populate("project team owners");

  return { totalCompleted: tasks.length, tasks };
};



app.get("/report/last-week", authMiddleware, async (req, res) => {
  try {
    const data = await getLastWeekCompletedTasks();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch last week report" });
  }
});


//pending work report

const getPendingWorkReport = async () => {
  const today = new Date();
  const tasks = await Task.find({ status: { $ne: "Completed" } });

  let totalPendingDays = 0;

  for (let t of tasks) {
    const daysPassed = Math.floor(
      (today - new Date(t.createdAt)) / (1000 * 60 * 60 * 24)
    );

    let remaining = t.timeToComplete - daysPassed;
    if (remaining < 0) remaining = 0;

    totalPendingDays += remaining;
  }

  return {
    totalPendingTasks: tasks.length,
    totalPendingDays
  };
};


app.get("/report/pending", authMiddleware, async (req, res) => {
  try {
    const data = await getPendingWorkReport();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch pending work report" });
  }
});


// closed tasks report

const getClosedTasksReport = async () => {
  const tasks = await Task.find({ status: "Completed" })
    .populate("team", "name")
    .populate("project", "name")
    .populate("owners", "name");

  const byTeam = {};
  const byOwner = {};
  const byProject = {};

  for (let task of tasks) {

    
    const teamName = task.team.name;
    byTeam[teamName] = (byTeam[teamName] || 0) + 1;

   
    const projectName = task.project.name;
    byProject[projectName] = (byProject[projectName] || 0) + 1;

    
    for (let owner of task.owners) {
      const ownerName = owner.name;
      byOwner[ownerName] = (byOwner[ownerName] || 0) + 1;
    }
  }

  return { byTeam, byOwner, byProject };
};


app.get("/report/closed-tasks", authMiddleware, async (req, res) => {
  try {
    const data = await getClosedTasksReport();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to generate closed task report" });
  }
});

























// START SERVER

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


