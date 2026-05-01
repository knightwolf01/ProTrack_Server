const User = require('../auth/user.model');
const Task = require('../tasks/task.model');
const Project = require('./project.model');
const {
  buildProjectAccessQuery,
  getMemberUserId,
  isProjectAdmin
} = require('./project.utils');

const projectQueryWithRelations = (query) =>
  query
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email');

const getProjectOrThrow = async (projectId, userId) => {
  const project = await projectQueryWithRelations(
    Project.findOne(buildProjectAccessQuery(projectId, userId))
  );

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  return project;
};

const requireProjectAdmin = (project, userId) => {
  if (!isProjectAdmin(project, userId)) {
    throw new Error('Only project admins can perform this action');
  }
};

exports.create = async (data, userId) => {
  const project = await Project.create({
    name: data.name,
    description: data.description,
    createdBy: userId,
    members: [{ user: userId, role: 'admin' }]
  });

  return getProjectOrThrow(project._id, userId);
};

exports.getAll = async (userId) =>
  projectQueryWithRelations(
    Project.find({ 'members.user': userId }).sort({ createdAt: -1 })
  );

exports.getById = async (projectId, userId) => getProjectOrThrow(projectId, userId);

exports.update = async (projectId, data, userId) => {
  const project = await getProjectOrThrow(projectId, userId);
  requireProjectAdmin(project, userId);

  project.name = data.name ?? project.name;
  project.description = data.description ?? project.description;
  await project.save();

  return getProjectOrThrow(projectId, userId);
};

exports.delete = async (projectId, userId) => {
  const project = await getProjectOrThrow(projectId, userId);
  requireProjectAdmin(project, userId);

  await Task.deleteMany({ projectId });
  await Project.deleteOne({ _id: projectId });
};

exports.addMember = async (projectId, userId, { email, role = 'member' }) => {
  const project = await getProjectOrThrow(projectId, userId);
  requireProjectAdmin(project, userId);

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Member email is required');
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error('No user found with that email address');
  }

  if (project.members.some((member) => getMemberUserId(member) === user._id.toString())) {
    throw new Error('User is already a member of this project');
  }

  project.members.push({
    user: user._id,
    role: role === 'admin' ? 'admin' : 'member'
  });

  await project.save();
  return getProjectOrThrow(projectId, userId);
};

exports.removeMember = async (projectId, userId, memberId) => {
  const project = await getProjectOrThrow(projectId, userId);
  requireProjectAdmin(project, userId);

  const ownerId =
    typeof project.createdBy === 'object' && project.createdBy._id
      ? project.createdBy._id.toString()
      : project.createdBy.toString();

  if (ownerId === memberId) {
    throw new Error('The project owner cannot be removed');
  }

  const memberToRemove = project.members.find(
    (member) => getMemberUserId(member) === memberId
  );

  if (!memberToRemove) {
    throw new Error('Member not found in this project');
  }

  if (memberToRemove.role === 'admin') {
    const adminCount = project.members.filter((member) => member.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('A project must keep at least one admin');
    }
  }

  project.members = project.members.filter(
    (member) => getMemberUserId(member) !== memberId
  );

  await project.save();
  return getProjectOrThrow(projectId, userId);
};
