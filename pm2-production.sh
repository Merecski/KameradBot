export NODE_ENV=production
go build -o database-prod && \
pm2 start "npm run start" --name kamerad_prod --time && \
pm2 start "./database-prod" --name kamerad_db_prod --time