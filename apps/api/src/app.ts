import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

fastify.get("/", () => {
  return { hello: "Fastify " };
});

/**
 * Run the server!
 */
const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exitCode = 1;
  }
};
void start();
