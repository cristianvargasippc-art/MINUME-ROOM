export const buildAssignmentScope = (user) => {
  if (!user) return { clause: "", params: [] };

  if (user.role === "delegado" || user.role === "mesa") {
    return { clause: "WHERE a.commission_id = $1", params: [user.commission_id] };
  }

  return { clause: "", params: [] };
};

export const buildAlertRoles = (role) => {
  if (role === "superadmin") return ["all", "superadmin"];
  return [role, "all"];
};