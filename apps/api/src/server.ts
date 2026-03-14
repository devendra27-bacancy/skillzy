import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { Server } from "socket.io";
import { registerCorsPlugin } from "./plugins/cors";
import { registerHttpRoutes } from "./routes/http";
import { registerSocketHandlers } from "./socket";

async function bootstrap() {
  const app = Fastify({ logger: true });

  await registerCorsPlugin(app);

  await app.register(cookie, {
    secret: "skillzy-demo-secret"
  });

  await registerHttpRoutes(app);
  const io = new Server(app.server, {
    cors: {
      origin: "*"
    }
  });
  registerSocketHandlers(io);

  const port = Number(process.env.PORT ?? 4000);

  await app.ready();
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Skillzy API running at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
