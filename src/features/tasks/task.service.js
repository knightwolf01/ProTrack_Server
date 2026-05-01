const Task = require('./task.model');
const Project = require('../projects/project.model');
const {
  buildProjectAccessQuery,
  getProjectMember,
  getMemberUserId,
  isProjectAdmin
} = require('../projects/project.utils');

const populateTaskRelations = (query) =>
  query
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('projectId', 'name');

const getProjectOrThrow = async (projectId, userId) => {
  const project = await Project.findOne(buildProjectAccessQuery(projectId, userId))
    .populate('members.user', 'name email');

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  return project;
};

const ensureAssignableMember = (project, assignedTo) => {
  if (!assignedTo) {
    return;
  }

  const isMember = project.members.some(
    (member) => getMemberUserId(member) === assignedTo
  );

  if (!isMember) {
    throw new Error('Assigned user must be a member of this project');
  }
};

const getTaskOrThrow = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  return task;
};

exports.create = async (projectId, data, userId) => {
  const project = await getProjectOrThrow(projectId, userId);
  if (!isProjectAdmin(project, userId)) {
    throw new Error('Only project admins can create tasks');
  }

  const assignedTo = data.assignedTo || undefined;
  ensureAssignableMember(project, assignedTo);

  const task = await Task.create({
    title: data.title,
    description: data.description,
    projectId,
    assignedTo,
    status: data.status || 'todo',
    dueDate: data.dueDate || undefined,
    createdBy: userId
  });

  return populateTaskRelations(Task.findById(task._id));
};

exports.getByProject = async (projectId, userId) => {
  await getProjectOrThrow(projectId, userId);
  return populateTaskRelations(
    Task.find({ projectId }).sort({ dueDate: 1, createdAt: -1 })
  );
};

exports.update = async (taskId, updates, userId) => {
  const task = await getTaskOrThrow(taskId);
  const project = await getProjectOrThrow(task.projectId, userId);
  const projectMember = getProjectMember(project, userId);

  if (!projectMember) {
    throw new Error('Not authorized');
  }

  if (projectMember.role === 'admin') {
    if (updates.assignedTo !== undefined) {
      ensureAssignableMember(project, updates.assignedTo || undefined);
      task.assignedTo = updates.assignedTo || undefined;
    }

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate || undefined;
  } else {
    const isAssignedToMember =
      task.assignedTo && task.assignedTo.toString() === userId;

    if (!isAssignedToMember) {
      throw new Error('Members can only update tasks assigned to them');
    }

    const allowedKeys = ['status'];
    const updateKeys = Object.keys(updates);
    if (updateKeys.some((key) => !allowedKeys.includes(key))) {
      throw new Error('Members can only update task status');
    }

    if (updates.status !== undefined) {
      task.status = updates.status;
    }
  }

  await task.save();
  return populateTaskRelations(Task.findById(task._id));
};

exports.delete = async (taskId, userId) => {
  const task = await getTaskOrThrow(taskId);
  const project = await getProjectOrThrow(task.projectId, userId);

  if (!isProjectAdmin(project, userId)) {
    throw new Error('Only project admins can delete tasks');
  }

  await Task.deleteOne({ _id: taskId });
};

exports.getDashboardStats = async (userId) => {
  const projects = await Project.find({ 'members.user': userId })
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

  const projectIds = projects.map((project) => project._id);
  const tasks = await populateTaskRelations(
    Task.find({ projectId: { $in: projectIds } }).sort({ dueDate: 1, createdAt: -1 })
  );

  const now = new Date();
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const overdueTasks = tasks.filter(
    (task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now
  ).length;
  const assignedToMe = tasks.filter(
    (task) => task.assignedTo && task.assignedTo._id.toString() === userId
  );

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    assignedToMe: assignedToMe.length,
    inProgressTasks: tasks.filter((task) => task.status === 'in-progress').length,
    todoTasks: tasks.filter((task) => task.status === 'todo').length,
    recentProjects: projects.slice(0, 4),
    myTasks: assignedToMe.slice(0, 6)
  };
};
