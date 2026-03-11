const express = require("express");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./middleware/error.middleware");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const swaggerSpec = require('./config/swagger');

const app = express();

const toOrigin = (value) => {
	if (!value) return null;
	try {
		return new URL(value.trim()).origin;
	} catch (error) {
		return value.trim();
	}
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy so secure cookies work when the app is behind a proxy/load-balancer.
app.set("trust proxy", 1);

const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)
	.map(toOrigin)
	.filter(Boolean);

const allowedOrigins = Array.from(new Set([
	...frontendOrigins,
	"http://localhost:3000",
	"http://localhost:5173",
	"http://localhost:5174",
	"http://127.0.0.1:5173",
	"https://fleet-management-kzif.onrender.com",
	"https://fleet-management-kzif.onrender.com/api/v1",
	"https://fleet-command-center-21.vercel.app"
].map(toOrigin).filter(Boolean)));

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error("CORS origin not allowed"), false);
		},
		credentials: true,
	})
);

// Serve uploaded files from backend/uploads
app.use("/images", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const loadRouter = (modulePath, label) => {
	try {
		const router = require(modulePath);
		if (typeof router === "function") return router;
		console.warn(`Skipping ${label}: module does not export an Express router`);
		return null;
	} catch (error) {
		console.warn(`Skipping ${label}: ${error.message}`);
		return null;
	}
};

const routesToMount = [
	{ base: "/api/v1/auth", modulePath: "./routes/auth.routes", label: "auth.routes" },
	{ base: "/api/v1/users", modulePath: "./routes/user.routes", label: "user.routes" },
	{ base: "/api/v1/broker", modulePath: "./routes/broker.routes", label: "broker.routes" },
	{ base: "/api/v1/company", modulePath: "./routes/company.routes", label: "company.routes" },
	{ base: "/api/v1/contract", modulePath: "./routes/contract.routes", label: "contract.routes" },
	{ base: "/api/v1/driver", modulePath: "./routes/driver.routes", label: "driver.routes" },
	{ base: "/api/v1/order", modulePath: "./routes/order.routes", label: "order.routes" },
	{ base: "/api/v1/payment", modulePath: "./routes/payment.routes", label: "payment.routes" },
	{ base: "/api/v1/rating", modulePath: "./routes/rating.routes", label: "rating.routes" },
	{ base: "/api/v1/tracking", modulePath: "./routes/tracking.routes", label: "tracking.routes" },
	{ base: "/api/v1/trip", modulePath: "./routes/trip.routes", label: "trip.routes" },
	{ base: "/api/v1/analytics", modulePath: "./routes/analytics.routes", label: "analytics.routes" },
];

for (const routeConfig of routesToMount) {
	const router = loadRouter(routeConfig.modulePath, routeConfig.label);
	if (router) {
		app.use(routeConfig.base, router);
	}
}

app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Backend is running",
		timestamp: new Date().toISOString(),
	});
});

app.get("/favicon.ico", (req, res) => {
	res.status(204).end();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.all("*", (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
