const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FYP Backend API',
      version: '1.0.0',
      description: 'Swagger documentation for finished APIs including Company, Auth, and Contract APIs.'
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
        Contract: {
          type: 'object',
          required: ['vendorId', 'transporterCompanyId', 'startDate', 'endDate', 'status'],
          properties: {
            _id: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f41' },
            vendorId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f99' },
            transporterCompanyId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
            message: { type: 'string', example: 'We would like to partner for recurring deliveries.' },
            startDate: { type: 'string', format: 'date-time', example: '2026-03-11T08:30:00.000Z' },
            endDate: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59.000Z' },
            commissionRate: { type: 'number', minimum: 0, example: 12.5 },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'TERMINATED'],
              example: 'PENDING'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ContractPopulated: {
          allOf: [
            { $ref: '#/components/schemas/Contract' },
            {
              type: 'object',
              properties: {
                vendorId: {
                  oneOf: [
                    { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f99' },
                    { $ref: '#/components/schemas/User' }
                  ]
                },
                transporterCompanyId: {
                  oneOf: [
                    { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
                    { $ref: '#/components/schemas/Company' }
                  ]
                }
              }
            }
          ]
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
        ContractInitiateRequest: {
          type: 'object',
          required: ['transporterCompanyId', 'startDate', 'endDate'],
          properties: {
            transporterCompanyId: { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f10' },
            startDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-15T09:00:00.000Z'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-12-31T18:00:00.000Z'
            },
            message: {
              type: 'string',
              maxLength: 1000,
              example: 'We would like to partner with your company for long-term delivery operations.'
            }
          }
        },
        MarketplaceOrderLocation: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string', example: 'Bole Road Warehouse 12' },
            city: { type: 'string', example: 'Addis Ababa' },
            state: { type: 'string', example: 'Addis Ababa' },
            country: { type: 'string', example: 'Ethiopia' },
            latitude: { type: 'number', example: 8.9806 },
            longitude: { type: 'number', example: 38.7578 },
            contactName: { type: 'string', example: 'Abebe Kebede' },
            contactPhone: { type: 'string', example: '0911223344' }
          }
        },
        MarketplaceCargo: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'FMCG' },
            description: { type: 'string', example: 'Cartoned dry goods' },
            weightKg: { type: 'number', minimum: 0, example: 1800 },
            quantity: { type: 'number', minimum: 1, example: 120 },
            unit: { type: 'string', enum: ['ITEM', 'BOX', 'PALLET', 'TON'], example: 'BOX' },
            specialHandling: {
              type: 'array',
              items: { type: 'string' },
              example: ['Keep dry']
            }
          }
        },
        MarketplaceVehicleRequirements: {
          type: 'object',
          properties: {
            vehicleType: { type: 'string', example: 'BOX_TRUCK' },
            minimumCapacityKg: { type: 'number', minimum: 0, example: 2000 }
          }
        },
        MarketplacePricing: {
          type: 'object',
          properties: {
            proposedBudget: { type: 'number', minimum: 0, example: 25000 },
            currency: { type: 'string', example: 'ETB' },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'BANK_TRANSFER', 'WALLET', 'CARD'],
              example: 'BANK_TRANSFER'
            },
            negotiable: { type: 'boolean', example: true }
          }
        },
        MarketplaceOrder: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67cf77b1be8f3b0fbd7d8fa1' },
            orderNumber: { type: 'string', example: 'ORD-1741780825481-AB12CD' },
            createdBy: {
              oneOf: [
                { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f99' },
                { $ref: '#/components/schemas/User' }
              ]
            },
            assignmentMode: {
              type: 'string',
              enum: ['DIRECT_COMPANY', 'DIRECT_PRIVATE_TRANSPORTER', 'OPEN_MARKETPLACE'],
              example: 'OPEN_MARKETPLACE'
            },
            targetCompanyId: {
              oneOf: [
                { type: 'string', nullable: true, example: null },
                { $ref: '#/components/schemas/Company' }
              ]
            },
            targetTransporterId: {
              oneOf: [
                { type: 'string', nullable: true, example: null },
                { $ref: '#/components/schemas/User' }
              ]
            },
            channel: { type: 'string', enum: ['MARKETPLACE'], example: 'MARKETPLACE' },
            status: {
              type: 'string',
              enum: ['OPEN', 'MATCHED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
              example: 'OPEN'
            },
            title: { type: 'string', example: 'Addis to Adama FMCG delivery' },
            description: { type: 'string', example: 'Deliver 120 boxes of packaged goods.' },
            pickupLocation: { $ref: '#/components/schemas/MarketplaceOrderLocation' },
            deliveryLocation: { $ref: '#/components/schemas/MarketplaceOrderLocation' },
            cargo: { $ref: '#/components/schemas/MarketplaceCargo' },
            vehicleRequirements: { $ref: '#/components/schemas/MarketplaceVehicleRequirements' },
            pickupDate: { type: 'string', format: 'date-time' },
            deliveryDeadline: { type: 'string', format: 'date-time', nullable: true },
            pricing: { $ref: '#/components/schemas/MarketplacePricing' },
            specialInstructions: { type: 'string', example: 'Driver should call before arrival.' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        MarketplaceOrderCreateRequest: {
          type: 'object',
          required: ['title', 'pickupLocation', 'deliveryLocation', 'pickupDate', 'proposedBudget'],
          properties: {
            assignmentMode: {
              type: 'string',
              enum: ['DIRECT_COMPANY', 'DIRECT_PRIVATE_TRANSPORTER', 'OPEN_MARKETPLACE'],
              example: 'OPEN_MARKETPLACE',
              description: 'OPEN_MARKETPLACE makes the order visible to both transporter companies and private transporters.'
            },
            targetCompanyId: {
              type: 'string',
              example: '67c9fbd9be8f3b0fbd7d8f10',
              description: 'Required when assignmentMode is DIRECT_COMPANY.'
            },
            targetTransporterId: {
              type: 'string',
              example: '67c9fbd9be8f3b0fbd7d8f11',
              description: 'Required when assignmentMode is DIRECT_PRIVATE_TRANSPORTER.'
            },
            title: { type: 'string', example: 'Addis to Adama FMCG delivery' },
            description: { type: 'string', example: 'Deliver 120 boxes of packaged goods.' },
            pickupLocation: { $ref: '#/components/schemas/MarketplaceOrderLocation' },
            deliveryLocation: { $ref: '#/components/schemas/MarketplaceOrderLocation' },
            cargo: { $ref: '#/components/schemas/MarketplaceCargo' },
            vehicleRequirements: { $ref: '#/components/schemas/MarketplaceVehicleRequirements' },
            pickupDate: { type: 'string', format: 'date-time', example: '2026-03-15T08:00:00.000Z' },
            deliveryDeadline: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-16T18:00:00.000Z'
            },
            proposedBudget: { type: 'number', minimum: 0, example: 25000 },
            currency: { type: 'string', example: 'ETB' },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'BANK_TRANSFER', 'WALLET', 'CARD'],
              example: 'BANK_TRANSFER'
            },
            negotiable: { type: 'boolean', example: true },
            specialInstructions: { type: 'string', example: 'Driver should call before arrival.' }
          }
        },
        OrderProposal: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67cf77b1be8f3b0fbd7d8fb2' },
            orderId: {
              oneOf: [
                { type: 'string', example: '67cf77b1be8f3b0fbd7d8fa1' },
                { $ref: '#/components/schemas/MarketplaceOrder' }
              ]
            },
            submittedByUserId: {
              oneOf: [
                { type: 'string', example: '67c9fbd9be8f3b0fbd7d8f99' },
                { $ref: '#/components/schemas/User' }
              ]
            },
            companyId: {
              oneOf: [
                { type: 'string', nullable: true, example: null },
                { $ref: '#/components/schemas/Company' }
              ]
            },
            proposalType: {
              type: 'string',
              enum: ['COMPANY', 'PRIVATE_TRANSPORTER'],
              example: 'COMPANY'
            },
            proposedPrice: { type: 'number', minimum: 0, example: 24000 },
            currency: { type: 'string', example: 'ETB' },
            message: { type: 'string', example: 'We can pick up within 2 hours.' },
            estimatedPickupDate: { type: 'string', format: 'date-time', nullable: true },
            vehicleDetails: { type: 'string', example: '5 ton box truck available.' },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
              example: 'PENDING'
            },
            reviewedBy: {
              oneOf: [
                { type: 'string', nullable: true, example: null },
                { $ref: '#/components/schemas/User' }
              ]
            },
            reviewedAt: { type: 'string', format: 'date-time', nullable: true },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
            rejectionReason: { type: 'string', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        OrderProposalCreateRequest: {
          type: 'object',
          properties: {
            proposedPrice: { type: 'number', minimum: 0, example: 24000 },
            currency: { type: 'string', example: 'ETB' },
            message: {
              type: 'string',
              maxLength: 1000,
              example: 'We can pick up within 2 hours and deliver the same day.'
            },
            estimatedPickupDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-15T10:00:00.000Z'
            },
            vehicleDetails: {
              type: 'string',
              maxLength: 500,
              example: '5 ton box truck with two loaders available.'
            }
          }
        },
        OrderProposalRejectRequest: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              maxLength: 1000,
              example: 'Pickup window is too late for this order.'
            }
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
  apis: [
    './src/docs/company.swagger.js',
    './src/docs/auth.swagger.js',
    './src/docs/contract.swagger.js',
    './src/docs/order.swagger.js',
    './src/docs/driver.swagger.js',
    './src/docs/broker.swagger.js'
  ]
};

module.exports = swaggerJsdoc(options);