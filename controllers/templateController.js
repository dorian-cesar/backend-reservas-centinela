import ServiceTemplate from "../models/ServiceTemplate.js";
import GeneratedService from "../models/GeneratedService.js";
import BusLayout from "../models/BusLayout.js";

// Helper
const formatDateOnly = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split("T")[0];
};

// Crear template
export const createTemplate = async (req, res) => {
    try {
        const template = await ServiceTemplate.create(req.body);
        return res.status(200).json({ success: true, id: template._id, message: "Template creado" });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Listar todos los templates
export const listTemplates = async (req, res) => {
    try {
        const templates = await ServiceTemplate.find()
            .populate("layout")
            .sort({ serviceNumber: 1 });

        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener template por ID
export const getTemplateById = async (req, res) => {
    try {
        const template = await ServiceTemplate.findById(req.params.id)
            .populate("layout");

        if (!template) {
            return res.status(404).json({ error: "Template no encontrado" });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar template
export const updateTemplate = async (req, res) => {
    try {
        const template = await ServiceTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("layout");

        if (!template) {
            return res.status(404).json({ error: "Template no encontrado" });
        }

        res.json(template);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar template
export const deleteTemplate = async (req, res) => {
    try {
        const template = await ServiceTemplate.findByIdAndDelete(req.params.id);

        if (!template) {
            return res.status(404).json({ error: "Template no encontrado" });
        }

        res.json({ message: "Template eliminado correctamente", template });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar templates agrupados por día de la semana
export const listTemplatesByDay = async (req, res) => {
    try {
        const templates = await ServiceTemplate.find()
            .populate("layout")
            .sort({ serviceNumber: 1 });

        // Agrupar por día de la semana
        const templatesByDay = {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: [],
            sabado: [],
            domingo: []
        };

        // Mapeo de números a nombres de días
        const dayMap = {
            1: 'lunes',
            2: 'martes',
            3: 'miercoles',
            4: 'jueves',
            5: 'viernes',
            6: 'sabado',
            7: 'domingo'
        };

        templates.forEach(template => {
            template.daysOfWeek.forEach(dayNumber => {
                const dayName = dayMap[dayNumber];
                if (dayName && templatesByDay[dayName]) {
                    templatesByDay[dayName].push({
                        _id: template._id,
                        serviceNumber: template.serviceNumber,
                        serviceName: template.serviceName,
                        origin: template.origin,
                        destination: template.destination,
                        time: template.time,
                        company: template.company,
                        layout: template.layout,
                        startDate: template.startDate,
                        daysOfWeek: template.daysOfWeek
                    });
                }
            });
        });

        // Ordenar cada día por serviceNumber
        Object.keys(templatesByDay).forEach(day => {
            templatesByDay[day].sort((a, b) => a.serviceNumber - b.serviceNumber);
        });

        res.json(templatesByDay);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener templates por día específico
export const getTemplatesBySpecificDay = async (req, res) => {
    try {
        const { day } = req.params;

        // Mapeo de nombres de días a números
        const dayNumberMap = {
            'lunes': 1,
            'martes': 2,
            'miercoles': 3,
            'jueves': 4,
            'viernes': 5,
            'sabado': 6,
            'domingo': 7
        };

        const dayNumber = dayNumberMap[day.toLowerCase()];

        if (!dayNumber) {
            return res.status(400).json({ error: "Día no válido" });
        }

        const templates = await ServiceTemplate.find({
            daysOfWeek: dayNumber
        })
            .populate("layout")
            .sort({ serviceNumber: 1 });

        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};