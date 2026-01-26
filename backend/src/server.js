const app = require('./app');
const { initCronJobs } = require('./cron');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initCronJobs();
});
