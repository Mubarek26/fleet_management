




const dispatcherJob = require('./dispatcher.job');
const idleDetectionJob = require('./idleDetection.job');

const startJobs = () => {
	dispatcherJob.startAutoVehicleAssignmentJob();
	idleDetectionJob.startIdleDetectionJob();
};

module.exports = startJobs;
