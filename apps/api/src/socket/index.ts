import type { Server } from "socket.io";
import { registerResponseHandlers } from "./responseHandlers";
import { registerSessionHandlers } from "./sessionHandlers";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    registerSessionHandlers(io, socket);
    registerResponseHandlers(io, socket);
  });
}
