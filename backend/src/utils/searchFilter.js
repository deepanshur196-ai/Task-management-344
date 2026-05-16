export const buildTaskQuery = ({ search, status, priority, project, assignedUser }) => {
  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (project) query.project = project;
  if (assignedUser) query.assignedUser = assignedUser;
  return query;
};
