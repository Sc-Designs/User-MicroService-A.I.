function getGroupStage(filter) {
  if (filter === "weekly") {
    return { year: { $year: "$createdAt" }, week: { $isoWeek: "$createdAt" } };
  } else if (filter === "monthly") {
    return { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
  } else {
    return { year: { $year: "$createdAt" } };
  }
}

export default getGroupStage;