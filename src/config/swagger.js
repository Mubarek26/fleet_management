const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FYP Backend API',
      version: '1.0.0',
      description: 'Swagger documentation for finished APIs (currently Company and Auth APIs).'
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || '/',
        description: process.env.SWAGGER_SERVER_URL ? 'Configured server' : 'Same origin server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Company: {
          type: 'object',
          required: ['companyName', 'phoneNumber', 'email', 'businessLicense', 'ownerId'],
          properties: {
            _id: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
            ownerId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f11' },
            companyName: { type: 'string', example: 'FastMove Logistics' },
            email: { type: 'string', format: 'email', example: 'contact@fastmove.com' },
            phoneNumber: { type: 'string', example: '+60123456789' },
            website: { type: 'string', example: 'https://fastmove.com' },
            photo: { type: 'string', example: 'company-1741159138280.jpg' },
            description: { type: 'string', example: 'Regional transport and logistics company' },
            numberOfCars: { type: 'number', example: 5 },
            businessLicense: { type: 'string', example: 'BL-2026-0001' },
            address: { type: 'string', example: 'Kuala Lumpur, Malaysia' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'PENDING' },
            active: { type: 'boolean', example: true }
          }
        },
        Driver: {
          type: 'object',
          required: ['fullName', 'phoneNumber', 'email', 'companyId'],
          properties: {
            _id: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f21' },
            userId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f22' },
            companyId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
            fullName: { type: 'string', example: 'Ali Ahmad' },
            phoneNumber: { type: 'string', example: '+60111222333' },
            email: { type: 'string', format: 'email', example: 'driver@fastmove.com' },
            licenseNumber: { type: 'string', example: 'D-1234567' },
            licensePhoto: { type: 'string', example: 'license-1741159138280.jpg' },
            driverPhoto: { type: 'string', example: 'driver-1741159138280.jpg' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'ACTIVE' },
            active: { type: 'boolean', example: true }
          }
        },
        Vehicle: {
          type: 'object',
          required: ['companyId', 'plateNumber', 'vehicleType'],
          properties: {
            _id: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f31' },
            companyId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
            plateNumber: { type: 'string', example: 'WXY1234' },
            vehicleType: { type: 'string', example: 'VAN' },
            model: { type: 'string', example: 'Toyota Hiace' },
            capacityKg: { type: 'number', example: 1500 },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], example: 'ACTIVE' },
            active: { type: 'boolean', example: true }
          }
        },
        CompanyCreateRequest: {
          type: 'object',
          required: ['companyName', 'phoneNumber', 'email', 'businessLicense'],
          properties: {
            companyName: { type: 'string', example: 'FastMove Logistics' },
            phoneNumber: { type: 'string', example: '+60123456789' },
            email: { type: 'string', format: 'email', example: 'contact@fastmove.com' },
            website: { type: 'string', example: 'https://fastmove.com' },
            description: { type: 'string', example: 'Regional transport and logistics company' },
            businessLicense: { type: 'string', example: 'BL-2026-0001' },
            address: { type: 'string', example: 'Kuala Lumpur, Malaysia' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'PENDING' },
            photo: { type: 'string', format: 'binary' }
          }
        },
        CompanyUpdateRequest: {
          type: 'object',
          properties: {
            companyName: { type: 'string', example: 'FastMove Logistics' },
            phoneNumber: { type: 'string', example: '+60123456789' },
            email: { type: 'string', format: 'email', example: 'contact@fastmove.com' },
            website: { type: 'string', example: 'https://fastmove.com' },
            description: { type: 'string', example: 'Regional transport and logistics company' },
            businessLicense: { type: 'string', example: 'BL-2026-0001' },
            address: { type: 'string', example: 'Kuala Lumpur, Malaysia' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'ACTIVE' },
            active: { type: 'boolean', example: true },
            photo: { type: 'string', format: 'binary' }
          }
        },
        VehicleCreateRequest: {
          type: 'object',
          required: ['plateNumber', 'vehicleType'],
          properties: {
            plateNumber: { type: 'string', example: 'WXY1234' },
            vehicleType: { type: 'string', example: 'VAN' },
            model: { type: 'string', example: 'Toyota Hiace' },
            capacityKg: { type: 'number', minimum: 0, example: 1500 },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], example: 'ACTIVE' }
          }
        },
        CompanyDriverCreateRequest: {
          type: 'object',
          required: ['fullName', 'phoneNumber', 'email', 'password'],
          properties: {
            fullName: { type: 'string', example: 'Ali Ahmad' },
            phoneNumber: { type: 'string', example: '+60111222333' },
            email: { type: 'string', format: 'email', example: 'driver@fastmove.com' },
            password: { type: 'string', example: 'StrongPass123' },
            licenseNumber: { type: 'string', example: 'D-1234567' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'ACTIVE' },
            userStatus: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'], example: 'ACTIVE' },
            driverPhoto: { type: 'string', format: 'binary' },
            licensePhoto: { type: 'string', format: 'binary' }
          }
        },
        CompanyDriverUpdateRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'Ali Ahmad' },
            phoneNumber: { type: 'string', example: '+60111222333' },
            email: { type: 'string', format: 'email', example: 'driver@fastmove.com' },
            licenseNumber: { type: 'string', example: 'D-1234567' },
            status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], example: 'ACTIVE' },
            userStatus: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'], example: 'ACTIVE' },
            driverPhoto: { type: 'string', format: 'binary' },
            licensePhoto: { type: 'string', format: 'binary' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f99' },
            fullName: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '0123456789' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: {
              type: 'string',
              enum: ['SHIPPER', 'VENDOR', 'DRIVER', 'COMPANY_ADMIN', 'PRIVATE_TRANSPORTER', 'BROKER', 'SUPER_ADMIN'],
              example: 'SHIPPER'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
              example: 'PENDING'
            },
            active: { type: 'boolean', example: true },
            companyId: { type: 'string', nullable: true, example: null },
            isAvailable: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AuthSignupRequest: {
          type: 'object',
          required: ['fullName', 'phoneNumber', 'email', 'password', 'passwordConfirm'],
          properties: {
            fullName: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '0123456789' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'StrongPass123' },
            passwordConfirm: { type: 'string', format: 'password', example: 'StrongPass123' },
            role: {
              type: 'string',
              enum: ['SHIPPER', 'VENDOR', 'DRIVER', 'COMPANY_ADMIN', 'PRIVATE_TRANSPORTER', 'BROKER', 'SUPER_ADMIN'],
              example: 'SHIPPER'
            },
            photo: { type: 'string', format: 'binary' }
          }
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Email or phone number. You can also send email or phoneNumber separately.',
              example: 'john@example.com'
            },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phoneNumber: { type: 'string', example: '0123456789' },
            password: { type: 'string', format: 'password', example: 'StrongPass123' }
          }
        },
        AuthForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' }
          }
        },
        AuthResetPasswordRequest: {
          type: 'object',
          required: ['password', 'passwordConfirm'],
          properties: {
            password: { type: 'string', format: 'password', example: 'NewStrongPass123' },
            passwordConfirm: { type: 'string', format: 'password', example: 'NewStrongPass123' }
          }
        },
        AuthUpdatePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'password', 'passwordConfirm'],
          properties: {
            currentPassword: { type: 'string', format: 'password', example: 'OldStrongPass123' },
            password: { type: 'string', format: 'password', example: 'NewStrongPass123' },
            passwordConfirm: { type: 'string', format: 'password', example: 'NewStrongPass123' }
          }
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'No company found with that ID' }
          }
        }
      }
    }
  },
  apis: ['./src/docs/company.swagger.js', './src/docs/auth.swagger.js']
};

module.exports = swaggerJsdoc(options);