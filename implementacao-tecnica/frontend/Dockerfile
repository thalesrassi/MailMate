# Dockerfile para o Frontend (React + Vite)
# Estágio 1: Build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm ci

# Copia o código da aplicação
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio 2: Produção
FROM nginx:alpine

# Copia os arquivos construídos para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Inicia o nginx
CMD ["nginx", "-g", "daemon off;"]

