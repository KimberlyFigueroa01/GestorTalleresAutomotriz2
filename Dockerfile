FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código de la aplicación
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
