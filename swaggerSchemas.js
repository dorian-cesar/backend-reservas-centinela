/**
 * Este archivo es generado automáticamente por generateSwaggerSchemas.js
 * No editar manualmente.
 */

export const schemas = {
  "BusLayout": {
    "title": "BusLayout",
    "required": [
      "name",
      "pisos",
      "capacidad",
      "floor1",
      "floor2"
    ],
    "properties": {
      "name": {
        "type": "string"
      },
      "pisos": {
        "type": "number"
      },
      "capacidad": {
        "type": "number"
      },
      "tipo_Asiento_piso_1": {
        "type": "string"
      },
      "tipo_Asiento_piso_2": {
        "type": "string"
      },
      "floor1": {
        "type": "object",
        "properties": {
          "seatMap": {
            "type": "array",
            "items": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "_id": {
            "type": "string"
          }
        }
      },
      "floor2": {
        "type": "object",
        "properties": {
          "seatMap": {
            "type": "array",
            "items": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "_id": {
            "type": "string"
          }
        }
      },
      "_id": {
        "type": "string"
      }
    }
  },
  "GeneratedService": {
    "title": "GeneratedService",
    "properties": {
      "template": {
        "type": "schemaobjectid"
      },
      "date": {
        "type": "string",
        "format": "date-time"
      },
      "origin": {
        "type": "string"
      },
      "destination": {
        "type": "string"
      },
      "busLayout": {
        "type": "schemaobjectid"
      },
      "seats": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "seatNumber": {
              "type": "string"
            },
            "reserved": {
              "type": "boolean"
            },
            "reservedBy": {
              "type": "schemaobjectid"
            },
            "reservationExpiresAt": {
              "type": "string",
              "format": "date-time"
            },
            "confirmed": {
              "type": "boolean"
            },
            "confirmedBy": {
              "type": "schemaobjectid"
            }
          },
          "required": []
        }
      },
      "_id": {
        "type": "string"
      }
    },
    "required": []
  },
  "Reservation": {
    "title": "Reservation",
    "properties": {
      "user": {
        "type": "schemaobjectid"
      },
      "service": {
        "type": "schemaobjectid"
      },
      "seatNumber": {
        "type": "string"
      },
      "createdAt": {
        "type": "string",
        "format": "date-time"
      },
      "expiresAt": {
        "type": "string",
        "format": "date-time"
      },
      "releasedAt": {
        "type": "string",
        "format": "date-time"
      },
      "releaseReason": {
        "type": "string"
      },
      "authorizationCode": {
        "type": "string"
      },
      "status": {
        "type": "string",
        "enum": [
          "reserved",
          "pending",
          "confirmed",
          "cancelled",
          "released",
          "expired"
        ]
      },
      "_id": {
        "type": "string"
      }
    },
    "required": []
  },
  "ServiceTemplate": {
    "title": "ServiceTemplate",
    "required": [
      "origin",
      "destination",
      "startDate",
      "time",
      "layout",
      "daysOfWeek"
    ],
    "properties": {
      "origin": {
        "type": "string"
      },
      "destination": {
        "type": "string"
      },
      "startDate": {
        "type": "string",
        "format": "date-time"
      },
      "time": {
        "type": "string"
      },
      "company": {
        "type": "string"
      },
      "layout": {
        "type": "schemaobjectid"
      },
      "daysOfWeek": {
        "type": "array",
        "items": {
          "type": "number"
        }
      },
      "_id": {
        "type": "string"
      }
    }
  },
  "User": {
    "title": "User",
    "properties": {
      "name": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "password": {
        "type": "string"
      },
      "role": {
        "type": "string",
        "enum": [
          "user",
          "admin"
        ]
      },
      "rut": {
        "type": "string"
      },
      "_id": {
        "type": "string"
      }
    },
    "required": []
  }
};
