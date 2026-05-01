const getMemberUserId = (member) => {
  if (!member?.user) {
    return null;
  }

  if (typeof member.user === 'object' && member.user._id) {
    return member.user._id.toString();
  }

  return member.user.toString();
};

const buildProjectAccessQuery = (projectId, userId) => ({
  _id: projectId,
  'members.user': userId
});

const getProjectMember = (project, userId) =>
  project.members.find((member) => getMemberUserId(member) === userId);

const isProjectAdmin = (project, userId) => getProjectMember(project, userId)?.role === 'admin';

module.exports = {
  buildProjectAccessQuery,
  getMemberUserId,
  getProjectMember,
  isProjectAdmin
};
