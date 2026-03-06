const app = require('./app');
const connectDB = require('./config/db');




const PORT = Number(process.env.PORT) || 5000;

let server;

const startServer = async () => {
	await connectDB();

	server = app.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`Server running on port ${PORT}`);
	});
};

startServer();

process.on('unhandledRejection', (reason) => {
	// eslint-disable-next-line no-console
	console.error('Unhandled Rejection:', reason);
	if (server) {
		server.close(() => {
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
});

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error('Uncaught Exception:', error);
	process.exit(1);
});
