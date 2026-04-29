# Serve the Vite production bundle with nginx (SPA fallback in nginx.conf).
# Build assets first: `npm ci && npm run build` (see npm script `docker:build`).
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
