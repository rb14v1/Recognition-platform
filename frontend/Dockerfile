FROM node:20-alpine

# Create a non-root group and user
RUN addgroup -g 1001 appuser \
    && adduser -u 1001 -G appuser -S appuser

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Drop privileges
USER appuser

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
