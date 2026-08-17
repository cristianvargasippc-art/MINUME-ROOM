const buildAssignmentScope = (user) => {
  if (!user) {
    return { clause: '', params: [] };
  }

  if (user.role === 'delegado') {
    return { clause: 'WHERE a.commission_id = ?', params: [user.commission_id] };
  }

  if (user.role === 'mesa') {
    return { clause: 'WHERE a.commission_id = ?', params: [user.commission_id] };
  }

  return { clause: '', params: [] };
};

const buildAlertRoles = (role) => {
  if (role === 'superadmin') {
    return ['all', 'superadmin'];
  }

  return [role, 'all'];
};

module.exports = {
  buildAssignmentScope,
  buildAlertRoles
};
