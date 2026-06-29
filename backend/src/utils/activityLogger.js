import Activity from '../models/Activity.js';

export const logActivity = ({ lead, user, type, message, metadata = {} }) => {
  return Activity.create({
    lead,
    user,
    type,
    message,
    metadata
  });
};
