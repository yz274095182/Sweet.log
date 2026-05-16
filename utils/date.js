function formatDateTime(value) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

module.exports = {
  formatDateTime
};

