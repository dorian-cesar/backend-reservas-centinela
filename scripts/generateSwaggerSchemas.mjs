import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { pathToFileURL } from "url";

const modelsDir = path.resolve(process.cwd(), "models");

function toPascalCase(str) {
    return str
        .replace(/(^\w|-\w|_\w)/g, (match) => match.replace(/[-_]/, '').toUpperCase());
}

async function importModels(dir) {
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith(".js") && f !== "index.js" && fs.statSync(path.join(dir, f)).isFile());
    const models = {};

    for (const file of files) {
        const modelPath = path.join(dir, file);
        // Forzar recarga
        await import(`${pathToFileURL(modelPath).href}?update=${Date.now()}`);
        const baseName = path.basename(file, ".js");
        const modelName = toPascalCase(baseName);

        const model = mongoose.models[modelName];
        if (!model || !model.schema) {
            console.warn(`No se encontró schema mongoose válido para modelo "${modelName}" en archivo ${file}`);
            continue;
        }
        models[modelName] = model;
    }

    // Debug: mostrar modelos registrados
    console.log("Modelos registrados en mongoose:", Object.keys(mongoose.models));
    for (const [name, model] of Object.entries(mongoose.models)) {
        console.log(`Modelo: ${name}, schema:`, !!model.schema, "tree:", model.schema && !!model.schema.tree);
    }

    return models;
}

async function generateSchemas() {
    // Import dinámico aquí
    const { default: mongooseToSwagger } = await import("mongoose-to-swagger");

    const modelsMap = await importModels(modelsDir);

    const swaggerSchemas = {};

    for (let [name, model] of Object.entries(modelsMap)) {
        if (!model || !model.schema || typeof model.schema !== "object" || !model.schema.tree) {
            console.warn(`El modelo ${name} no tiene un schema válido`);
            continue;
        }
        console.log(`Generando schema para: ${name}`);

        try {
            // mongoose-to-swagger acepta tanto el modelo como el schema, pero mejor pasar el modelo
            const swaggerSchema = mongooseToSwagger(model);

            // Asegura el campo required si no está presente
            if (!swaggerSchema.required) {
                swaggerSchema.required = Object.keys(model.schema.paths).filter(
                    (key) => model.schema.paths[key].isRequired || false
                );
            }

            swaggerSchemas[name] = swaggerSchema;
        } catch (error) {
            console.error(`Error generando swagger schema para ${name}:`, error);
        }
    }

    const output = `/**
 * Este archivo es generado automáticamente por generateSwaggerSchemas.js
 * No editar manualmente.
 */

export const schemas = ${JSON.stringify(swaggerSchemas, null, 2)};
`;

    fs.writeFileSync(path.resolve("./swaggerSchemas.js"), output, "utf-8");
    console.log("Archivo swaggerSchemas.js generado correctamente.");
}

generateSchemas().catch(console.error);