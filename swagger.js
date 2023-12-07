const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MicroBlab Application API',
      version: '1.0.0',
      description: 'This is a REST API for a Microblab',
    },
    components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Auth-Token',
          }
        }
      },
      security: [{
        ApiKeyAuth: [],
      }],
    servers: [
      {
        url: 'http://localhost:5000/api' // Adjust the port and base URL as necessary
      },
      {
        url: 'https://microblab.onrender.com/api' // Adjust the port and base URL as necessary
      }
    ]
  },
  apis: ['./routes/api/*.js'], // Path to the API routes
};

const openapiSpecification = swaggerJsdoc(options);

module.exports = openapiSpecification;
