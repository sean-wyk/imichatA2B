import { Redis } from "@upstash/redis";
import { configureServerNetwork } from "@/lib/serverNetwork";

configureServerNetwork();

export const redis = Redis.fromEnv();

