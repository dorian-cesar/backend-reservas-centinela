export const sendEmail = async (req, res) => {
    try {
        const { email, datos } = req.body;

        console.log("Email:", email);
        console.log("Datos:", JSON.stringify(datos, null, 2));

        // Respuesta simple con los datos recibidos
        const respuesta = {
            success: true,
            message: "Datos recibidos correctamente",
            timestamp: new Date().toISOString(),
            datosRecibidos: {
                email,
                datos
            }
        };

        console.log("Respuesta:");
        console.log(JSON.stringify(respuesta, null, 2));

        res.json(respuesta);

    } catch (error) {
        console.error("Error en sendEmail:", error);

        const errorResponse = {
            success: false,
            message: "Error procesando la solicitud",
            error: error.message,
            timestamp: new Date().toISOString()
        };

        console.log("Respuesta de error:");
        console.log(JSON.stringify(errorResponse, null, 2));

        res.status(500).json(errorResponse);
    }
};