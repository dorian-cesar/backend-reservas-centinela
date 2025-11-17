import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { schemas } from './swaggerSchemas.js'; // <--- IMPORTANTE

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentación',
            version: '1.0.0',
            description: 'Documentación generada con Swagger',
        },
        components: {
            schemas, // <--- Aquí se anexan los schemas generados
        },
    },
    apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}