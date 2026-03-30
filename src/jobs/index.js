




const dispatcherJob = require('./dispatcher.job');

const startJobs = () => {
	dispatcherJob.startAutoVehicleAssignmentJob();
};

module.exports = startJobs;
